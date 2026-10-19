// Integração com rede simulada. Não comprova Supabase/RLS nem publicação real.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const driver = { position:'1', points:'100', wins:'4', Driver:{driverId:'senna',givenName:'Ayrton',familyName:'Senna',nationality:'Brazilian'}, Constructors:[{name:'McLaren'}] };
let favorites = [], history = [], failDB = false, emptyAPI = false;
const server = http.createServer((req,res) => {
  const file = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err,data) => {res.writeHead(err ? 404:200, {'Content-Type': file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(err?'Not found':data);});
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true, ...(process.env.F1_BROWSER_PATH ? {executablePath:process.env.F1_BROWSER_PATH}: {})});
  try {
    const page = await browser.newPage({viewport:{width:1365,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/config.js', route => route.fulfill({contentType:'text/javascript',body:'window.F1_CONFIG={supabaseUrl:"https://test.supabase.co",supabaseKey:"sb_publishable_test"};'}));
    await page.route('https://api.jolpi.ca/**', route => {
      const url = route.request().url();
      const body = url.includes('constructorstandings') ? {MRData:{StandingsTable:{StandingsLists:[]}}} : url.includes('races') ? {MRData:{RaceTable:{Races:[]}}} : {MRData:{StandingsTable:{StandingsLists:emptyAPI?[]:[{round:'4',DriverStandings:[driver]}]}}};
      return route.fulfill({json:body});
    });
    await page.route('https://test.supabase.co/**', async route => {
      const req=route.request(), url=new URL(req.url()), table=url.pathname.split('/').pop();
      if (failDB) return route.fulfill({status:403,json:{code:'42501'}});
      let data;
      if (table==='estatisticas_favoritos') data={total:favorites.length,recente:favorites[0]?.nome,equipe:favorites[0]?.equipe,equipes:favorites.length?1:0};
      else if (table==='favoritos') {
        if(req.method()==='POST') {
          const row=req.postDataJSON();
          if(favorites.some(f=>f.piloto_id===row.piloto_id && f.temporada===row.temporada)) return route.fulfill({status:409,json:{code:'23505'}});
          favorites.unshift({...row,id:1});
        } else if(req.method()==='DELETE') favorites=[];
        data=favorites;
      } else {
        if(req.method()==='POST') history.unshift({...req.postDataJSON(),id:history.length+1});
        data=history.slice(0,5);
      }
      return route.fulfill({json:data});
    });
    const url=`http://127.0.0.1:${server.address().port}`;
    await page.goto(url);
    await page.locator('#drivers-list [data-save]').waitFor();
    await page.locator('#drivers-list [data-save]').click();
    await page.getByRole('button',{name:'Remover Ayrton Senna, temporada 2026'}).waitFor();
    assert.match(await page.locator('#saved-stats').innerText(), /Ayrton Senna/);
    await page.reload();
    await page.getByRole('button',{name:'Remover Ayrton Senna, temporada 2026'}).waitFor();
    await page.locator('#drivers-list [data-save]').click();
    await page.waitForFunction(()=>document.querySelector('#db-message').textContent.includes('já está'));
    await page.locator('#driver-search').fill('senna');
    await page.locator('#driver-search').press('Enter');
    await page.locator('#search-history button').first().waitFor();
    assert.equal(history[0].encontrado,true);
    await page.locator('#driver-search').fill('inexistente');
    await page.locator('#search-driver').click();
    await page.waitForFunction(()=>document.querySelector('#search-history').textContent.includes('inexistente'));
    assert.equal(history[0].encontrado,false);
    await page.locator('#search-history button').filter({hasText:'senna'}).click();
    await page.waitForFunction(()=>document.querySelector('#driver-result').textContent.includes('Ayrton Senna'));
    await page.getByRole('button',{name:'Remover Ayrton Senna, temporada 2026'}).click();
    await page.waitForFunction(()=>document.querySelector('#favorites-list').textContent.includes('Nenhum favorito'));
    failDB=true;
    await page.locator('#refresh-saved').click();
    await page.waitForFunction(()=>document.querySelector('#db-message').textContent.includes('RLS'));
    failDB=false;
    favorites=[{id:2,nome:'<img src=x onerror=alert(1)>',equipe:'McLaren',temporada:2026}];
    await page.locator('#refresh-saved').click();
    await page.waitForFunction(()=>document.querySelector('#favorites-list').textContent.includes('<img'));
    assert.equal(await page.locator('#favorites-list img').count(),0);
    await page.screenshot({path:process.env.F1_SCREENSHOT_DESKTOP || path.join(root,'test-results','desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:process.env.F1_SCREENSHOT_MOBILE || path.join(root,'test-results','mobile.png'),fullPage:true});
    emptyAPI=true;
    await page.locator('#load-season').click();
    await page.waitForFunction(()=>document.querySelector('#drivers-list').textContent.includes('No drivers'));
    emptyAPI=false;
    await page.route('**/config.js', route => route.fulfill({contentType:'text/javascript',body:'window.F1_CONFIG={supabaseUrl:"",supabaseKey:""};'}));
    await page.reload();
    await page.locator('#drivers-list [data-save]').waitFor();
    await page.waitForFunction(()=>document.querySelector('#db-message').textContent.includes('Configure'));
    await page.locator('#drivers-list [data-save]').click();
    await page.waitForFunction(()=>document.querySelector('#db-message').textContent.includes('Configure'));
    assert.deepEqual(errors,[]);
    console.log('PASS: classificação, salvar/listar/remover, recarga, duplicado, buscas, repetição, RLS simulada, XSS, temporada vazia, viewport móvel e configuração ausente.');
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
