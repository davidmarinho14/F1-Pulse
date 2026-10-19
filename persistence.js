const database = createF1Database(window.F1_CONFIG);
const favoritesList = document.getElementById("favorites-list");
const statsList = document.getElementById("saved-stats");
const historyList = document.getElementById("search-history");
const dbMessage = document.getElementById("db-message");
const historyMessage = document.getElementById("history-message");
const moreButton = document.getElementById("more-favorites");
let savedRows = [];
let savedRequest = 0;
let mutationBusy = false;
let replayBusy = false;
const PAGE_SIZE = 50;

async function refreshSaved(append = false) {
  const request = ++savedRequest;
  dbMessage.textContent = "Carregando favoritos e estatísticas...";
  moreButton.disabled = true;
  try {
    const offset = append ? savedRows.length : 0;
    const [rows, stats] = await Promise.all([
      database.request(`favoritos?select=*&order=criado_em.desc,id.desc&limit=${PAGE_SIZE}&offset=${offset}`),
      database.request("rpc/estatisticas_favoritos", "POST", {})
    ]);
    if (request !== savedRequest) return;
    savedRows = append ? [...savedRows, ...rows] : rows;
    favoritesList.replaceChildren();
    if (!savedRows.length) favoritesList.textContent = "Nenhum favorito. Salve um piloto na classificação ou na busca.";
    for (const row of savedRows) {
      const item = document.createElement("div");
      item.className = "saved-row";
      const text = document.createElement("span");
      text.textContent = `${row.nome} · ${row.equipe} · ${row.temporada}`;
      const button = document.createElement("button");
      button.textContent = "Remover";
      button.setAttribute("aria-label", `Remover ${row.nome}, temporada ${row.temporada}`);
      button.addEventListener("click", () => mutate(button, () => database.request(`favoritos?id=eq.${encodeURIComponent(row.id)}`, "DELETE")));
      item.append(text, button);
      favoritesList.append(item);
    }
    statsList.replaceChildren();
    for (const [label, value] of [["Total de favoritos", stats.total], ["Favorito mais recente", stats.recente || "Nenhum"], ["Equipe mais frequente", stats.equipe || "Nenhuma"], ["Equipes representadas", stats.equipes]]) {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      statsList.append(dt, dd);
    }
    moreButton.hidden = rows.length < PAGE_SIZE;
    dbMessage.textContent = "Dados carregados do Supabase.";
  } catch (error) {
    if (request !== savedRequest) return;
    // Não apresentar números antigos como se refletissem o banco atual.
    statsList.textContent = "Estatísticas indisponíveis. Atualize para tentar novamente.";
    dbMessage.textContent = error.message;
  } finally {
    if (request === savedRequest) moreButton.disabled = false;
  }
}

async function mutate(button, operation) {
  if (mutationBusy) return;
  mutationBusy = true;
  button.disabled = true;
  dbMessage.textContent = "Salvando alteração...";
  try {
    await operation();
    await refreshSaved();
  } catch (error) { dbMessage.textContent = error.message; }
  finally { mutationBusy = false; button.disabled = false; }
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-save]");
  if (!button) return;
  const driver = currentDrivers.find(row => row.Driver.driverId === button.dataset.save);
  if (!driver || loadedSeason !== seasonSelect.value) {
    dbMessage.textContent = "Carregue a temporada antes de salvar um piloto.";
    return;
  }
  void mutate(button, () => database.request("favoritos", "POST", {
    piloto_id: driver.Driver.driverId, temporada: Number(loadedSeason),
    nome: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
    equipe: driver.Constructors?.[0]?.name || "Unknown team",
    nacionalidade: driver.Driver.nationality || "Unknown"
  }));
});

async function refreshHistory() {
  try {
    const rows = await database.request("historico?select=*&order=criado_em.desc,id.desc&limit=5");
    historyList.replaceChildren();
    if (!rows.length) historyList.textContent = "Nenhuma busca registrada.";
    for (const row of rows) {
      const button = document.createElement("button");
      button.textContent = `${row.termo} · ${row.temporada} · ${row.encontrado ? "encontrado" : "sem resultado ou falha"}`;
      button.addEventListener("click", async () => {
        if (replayBusy) return;
        replayBusy = true;
        button.disabled = true;
        try {
          seasonSelect.value = String(row.temporada);
          if (seasonSelect.value !== String(row.temporada)) {
            const option = new Option(String(row.temporada), String(row.temporada));
            seasonSelect.add(option);
            seasonSelect.value = String(row.temporada);
          }
          await loadSeason();
          driverSearch.value = row.termo;
          await searchDriver();
        } finally { replayBusy = false; button.disabled = false; }
      });
      historyList.append(button);
    }
    historyMessage.textContent = "Histórico público salvo no Supabase.";
  } catch (error) { historyMessage.textContent = error.message; }
}

async function recordSearch(termo, temporada, encontrado) {
  try {
    await database.request("historico", "POST", { termo, temporada: Number(temporada), encontrado });
    await refreshHistory();
  } catch (error) {
    historyMessage.textContent = `A busca foi realizada, mas o histórico não foi salvo: ${error.message}`;
  }
}
document.getElementById("refresh-saved").addEventListener("click", () => { void refreshSaved(); void refreshHistory(); });
moreButton.addEventListener("click", () => refreshSaved(true));
void refreshSaved();
void refreshHistory();
