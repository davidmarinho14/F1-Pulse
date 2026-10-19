const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../db.js');
const config = { supabaseUrl: 'https://test.supabase.co', supabaseKey: 'sb_publishable_test' };
test('sem configuração ou com chave secreta não faz requisição', async () => {
  for (const c of [{}, {...config, supabaseKey: 'sb_secret_test'}]) {
    const db = createDatabase(c, () => assert.fail('Não deve acessar a rede'));
    assert.equal(db.configured, false);
    await assert.rejects(db.request('favoritos'), /Configure/);
  }
});
test('CRUD envia dados JSON e chave pública', async () => {
  const calls = [];
  const db = createDatabase(config, async (url, options) => {
    calls.push({url, ...options});
    return new Response(JSON.stringify([{id: 1}]), { status: 200 });
  });
  await db.request('favoritos', 'POST', {nome:'Senna'});
  await db.request('favoritos?select=*');
  await db.request('favoritos?id=eq.1', 'DELETE');
  assert.deepEqual(calls.map(c => c.method), ['POST', 'GET', 'DELETE']);
  assert.equal(calls[0].headers.apikey, config.supabaseKey);
  assert.equal(JSON.parse(calls[0].body).nome, 'Senna');
});
test('duplicado, RLS, limite, falha do servidor e rede geram mensagens', async () => {
  for (const [status, code, pattern] of [[409,'23505',/já está/],[403,'42501',/RLS/],[429,'',/Aguarde/],[500,'',/não concluiu/]]) {
    const db = createDatabase(config, async () => new Response(JSON.stringify({code}), {status}));
    await assert.rejects(db.request('favoritos'), pattern);
  }
  const offline = createDatabase(config, async () => { throw new TypeError('offline'); });
  await assert.rejects(offline.request('favoritos'), /internet/);
  const timeout = createDatabase(config, async () => { throw new DOMException('timeout','AbortError'); });
  await assert.rejects(timeout.request('favoritos'), /internet/);
});
