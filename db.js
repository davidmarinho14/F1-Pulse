/* API REST do Supabase: sem SDK externo e sem persistência simulada. */
(function (root) {
  function createDatabase(config, transport = fetch) {
    const url = (config?.supabaseUrl || "").replace(/\/$/, "");
    const key = config?.supabaseKey || "";
    let publicKey = key.startsWith("sb_publishable_");
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      publicKey = payload.role === "anon";
    } catch { /* Chave publishable não é JWT. */ }
    const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && publicKey;
    async function request(path, method = "GET", body) {
      if (!configured) throw new Error("Configure a URL e a chave pública do Supabase em config.js.");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await transport(`${url}/rest/v1/${path}`, {
          method, signal: controller.signal,
          headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json", Prefer: "return=representation" },
          ...(body === undefined ? {} : { body: JSON.stringify(body) })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const error = new Error(data?.code === "23505" ? "Este piloto já está nos favoritos desta temporada."
            : [401, 403].includes(response.status) ? "Acesso ao banco negado. Confira a chave pública, os grants e as políticas RLS."
            : response.status === 429 ? "Muitas solicitações. Aguarde e tente novamente."
            : "O banco não concluiu a operação. Confira a configuração e tente novamente.");
          error.code = data?.code;
          throw error;
        }
        return data;
      } catch (error) {
        if (error.name === "AbortError" || error instanceof TypeError) {
          throw new Error("Não foi possível conectar ao banco. Verifique a internet e tente novamente.");
        }
        throw error;
      } finally { clearTimeout(timer); }
    }
    return { configured, request };
  }
  root.createF1Database = createDatabase;
  if (typeof module !== "undefined") module.exports = { createDatabase };
})(globalThis);
