# F1 Pulse — Bootcamp II · Etapa 02

**Autor:** David Richard Marinho — matrícula 22610620.

Dashboard de Fórmula 1 em HTML, CSS e JavaScript que consulta temporadas na Jolpica F1 API. A Etapa 02 evolui o projeto original com pilotos favoritos no Supabase, histórico de buscas, estatísticas dos dados persistidos e distribuição por imagem Docker.

## Links da entrega

- **Repositório público:** https://github.com/davidmarinho14/F1-Pulse
- **Aplicação no GitHub Pages:** https://davidmarinho14.github.io/F1-Pulse/
- **Imagem pública no Docker Hub:** https://hub.docker.com/r/davidmarinho14/f1-pulse
- **Tags disponíveis:** `1.0` e `latest` (Linux/amd64).
- **Publicação e teste de download em ambiente limpo:** https://github.com/davidmarinho14/F1-Pulse/actions/runs/39190206085

## Continuidade da Etapa 01

O mesmo repositório e o histórico Git foram preservados, com mais de cinco commits reais incrementais nesta etapa. A evolução foi integrada em `main` e publicada no Pages. O código mantém a identidade visual original, seleção de temporadas, classificação de pilotos e construtores, calendário, pesquisa, indicadores e tratamento de erros.

O ZIP da apostila era uma Pokédex de exemplo; o F1 Pulse original foi obtido do repositório indicado na primeira entrega e evoluído. A documentação anterior permanece em [docs/README-etapa01.md](docs/README-etapa01.md).

## Funcionalidades

- Consulta assíncrona à Jolpica por temporada, classificação e calendário.
- Busca de pilotos por botão ou Enter, com resultado detalhado.
- Salvar, listar e remover favoritos em banco PostgreSQL real, acessado pela API REST do Supabase.
- Unicidade por `piloto_id` e `temporada`: o mesmo piloto pode ser salvo em anos diferentes.
- Favoritos sobrevivem à recarga da página; não são simulados nem gravados em localStorage.
- Coleção **pública e compartilhada**, conforme o modelo acadêmico da apostila: todos os visitantes veem e podem remover os mesmos favoritos. Não há autenticação individual.
- Lista paginada em blocos de 50 favoritos e botão para atualizar dados alterados por outros visitantes.
- Mensagens para configuração ausente, rede, timeout, duplicados, acesso negado, limite de requisições e falha do banco.
- Renderização dos registros do banco como texto, evitando interpretar conteúdo salvo como HTML.

## Sidequests concluídas

- [x] **A — Histórico de buscas:** segunda tabela `historico`, com termo, temporada, data e indicador `encontrado`. Registra buscas com resultado, sem resultado e com falha; mostra as últimas cinco em ordem decrescente, clicáveis. Clicar restaura a temporada e refaz a busca. Busca vazia não é enviada. A gravação acontece em segundo plano e sua falha não apaga o resultado da consulta. Como o esquema usa um booleano, ausência de resultado e falha são representadas por `false`.
- [x] **C — Estatísticas dos favoritos:** total de favoritos, favorito mais recente, equipe mais frequente e quantidade de equipes representadas. A função SQL `estatisticas_favoritos()` calcula os indicadores no banco sobre todos os registros, sem depender da paginação da lista. O painel é atualizado após salvar/remover; em empate de equipes, usa ordem alfabética.

O Compose foi incluído como recurso extra. Não é reivindicada a sidequest B, pois não houve uma versão 1.1 com melhoria em relação à 1.0.

## APIs, banco e segurança

**Jolpica F1 API:** https://github.com/jolpica/jolpica-f1

Endpoints usados, com base `https://api.jolpi.ca/ergast/f1`:

- `/{season}/driverstandings/`: classificação dos pilotos.
- `/{season}/constructorstandings/`: classificação dos construtores.
- `/{season}/races/`: calendário.
- `/{season}/drivers/{driverId}/driverstandings/`: detalhes da classificação do piloto pesquisado.

**Supabase:** https://supabase.com/docs/guides/api

| Objeto | Campos ou função |
| --- | --- |
| `favoritos` | `id`, `criado_em`, `piloto_id`, `temporada`, `nome`, `equipe`, `nacionalidade`; UNIQUE em piloto/temporada |
| `historico` | `id`, `criado_em`, `termo`, `temporada`, `encontrado` |
| `estatisticas_favoritos()` | Retorna total, favorito recente, equipe mais frequente e quantidade de equipes |

O SQL está em [docs/setup_supabase.sql](docs/setup_supabase.sql). Ativa RLS nas duas tabelas, valida tamanhos e temporada e concede ao papel `anon` somente:

- SELECT, INSERT e DELETE de favoritos;
- SELECT e INSERT de histórico;
- uso das sequências necessárias e execução da função de estatísticas.

UPDATE não é permitido; DELETE de histórico também não. A função usa `security invoker`, respeitando as permissões do chamador. O papel `authenticated` não é utilizado por este frontend e não recebe essas permissões no script.

A URL e a chave **pública publishable** do projeto do autor estão configuradas em `config.js`. Elas são visíveis por natureza; os dados são controlados por grants/RLS. Não há senha do banco, chave `service_role`, chave secret ou token Docker no código. O token Docker fica somente no segredo `DOCKERHUB_TOKEN` do GitHub Actions.

Documentação de RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

### Usar outro projeto Supabase

1. Crie seu projeto em https://supabase.com/dashboard.
2. Execute `docs/setup_supabase.sql` uma vez no SQL Editor. O script cria tabelas novas em uma transação, sem apagar tabelas existentes. Se já houver tabelas com os mesmos nomes, revise e adapte uma migração; não apague dados para contornar o erro.
3. Em Connect ou configurações de API, copie Project URL e a chave pública publishable/anon.
4. Substitua os valores em `config.js`:

```js
window.F1_CONFIG = {
  supabaseUrl: "", // URL real do seu projeto
  supabaseKey: ""  // somente chave pública publishable ou anon
};
```

Sem configuração válida, a área persistente informa o problema e as consultas à Jolpica continuam disponíveis. Para favoritos privados por pessoa, seria necessário acrescentar autenticação e políticas por `auth.uid()`; esta entrega usa a coleção compartilhada da apostila.

## Executar

### Navegador

Acesse https://davidmarinho14.github.io/F1-Pulse/.

### Imagem pública — um comando

Com Docker Engine/Desktop em execução e containers Linux habilitados:

```bash
docker run -d --name f1-pulse -p 8080:80 davidmarinho14/f1-pulse:1.0
```

Abra http://localhost:8080. A imagem publicada é Linux/amd64 e já contém a configuração pública do Supabase do autor. Ela precisa de conexão à internet para acessar Jolpica e Supabase.

Para encerrar:

```bash
docker stop f1-pulse
docker rm f1-pulse
```

### Código local

```bash
git clone https://github.com/davidmarinho14/F1-Pulse.git
cd F1-Pulse
python -m http.server 5500
```

Abra http://localhost:5500. Também é possível usar Live Server. Os caminhos relativos funcionam no subdiretório `/F1-Pulse/` do Pages.

### Construção local ou Compose

```bash
docker build -t f1-pulse:1.0 .
docker run -d --name f1-pulse-local -p 8080:80 f1-pulse:1.0
```

Ou:

```bash
docker compose up --build -d
docker compose down
```

O Dockerfile usa `nginx:stable-alpine`, copia somente os arquivos públicos, expõe porta 80 e inclui healthcheck HTTP. `.dockerignore` exclui Git, testes, documentação, pacotes e arquivos de ambiente do contexto.

`config.js` é copiado durante o build: altere-o antes de construir e reconstrua a imagem depois de mudanças. `docker run -e` não substitui automaticamente valores em arquivos estáticos. O banco permanece no Supabase quando o container é recriado.

## Publicar atualizações Docker pelo GitHub

O workflow `.github/workflows/docker.yml` constrói e verifica o container nas atualizações de `main`. A publicação é manual:

1. Mantenha o segredo `DOCKERHUB_TOKEN` com um token válido de leitura/escrita do Docker Hub.
2. Em Actions → **Docker - construir e publicar** → **Run workflow**, escolha `main`.
3. A ação constrói, testa e publica `davidmarinho14/f1-pulse:1.0` e `latest`.
4. Outro job, em runner limpo e sem login no Hub, baixa a imagem pública e verifica a resposta HTTP e o arquivo de configuração.

Para uma nova versão do produto, ajuste a tag no workflow e nos comandos do README antes de publicar. O token criado para esta entrega tem validade limitada; renove o segredo se precisar publicar após sua expiração. Isso não impede baixar as imagens públicas já publicadas.

## Testes executados e limites

Verificações realizadas em 18/10/2026:

- `node --check script.js`, `db.js` e `persistence.js`: passaram.
- `node --test tests/db.test.cjs`: **3 testes passaram**, cobrindo configuração, rejeição de chave secreta, requisições CRUD e mensagens para duplicado, permissões, limite, erro de servidor, rede e timeout.
- `node tests/browser.cjs`: integração com APIs simuladas passou, incluindo salvar/listar/remover, recarga, duplicados, buscas com/sem resultado, repetição de histórico, falhas de acesso, texto malicioso, temporada vazia, configuração ausente e largura móvel sem rolagem horizontal. Capturas desktop de 1365 px e móvel de 390 px foram inspecionadas.
- **Supabase real:** SELECT nas duas tabelas, INSERT/SELECT/DELETE de favorito temporário, duplicado rejeitado com `23505`, UPDATE de favorito negado, UPDATE/DELETE de histórico negados e função de estatísticas funcionando. O registro temporário foi removido.
- **Interface com APIs reais:** salvar, recarregar, remover e gravar/listar histórico passaram. Uma busca de piloto permaneceu no histórico compartilhado.
- **Pages público:** o navegador carregou favoritos/estatísticas do Supabase e classificação real de 2025.
- **Docker no GitHub Actions:** build, execução e resposta HTTP do container passaram; login e envio das tags `1.0`/`latest` passaram. Em outro runner, sem imagem local e sem login, o download e a execução da imagem pública passaram. Evidência: https://github.com/davidmarinho14/F1-Pulse/actions/runs/39190206085
- As duas tags foram verificadas na página pública Docker Hub e apontavam ao mesmo digest `sha256:c8312d3fd768e605c05ccf13245cb8897c78cc8f3221d412d7057d7cab9d16c6`.

Não houve teste em dois dispositivos físicos nem inspeção administrativa do catálogo RLS. As restrições de acesso foram verificadas pela chave pública. O teste remoto do container verifica HTTP/arquivos; o fluxo de banco pela interface foi verificado localmente e no acesso ao Pages descrito acima. Docker não estava instalado no computador local; a validação do container foi feita nos runners do GitHub.

Para repetir os testes simulados:

```bash
npm install
npx playwright install chromium
npm test
npm run test:browser
```

Opcionalmente, defina `F1_BROWSER_PATH` com um Chrome/Chromium instalado. Os testes simulados usam servidor local e não escrevem no Supabase real; capturas ficam em `test-results/`, ignorado pelo Git. O roteiro para novas validações está em [docs/VALIDACAO.md](docs/VALIDACAO.md).

## Estrutura e pacote

```text
F1-Pulse/
├── index.html, style.css, script.js
├── config.js, db.js, persistence.js
├── Dockerfile, .dockerignore, docker-compose.yml
├── .github/workflows/docker.yml
├── docs/setup_supabase.sql
├── docs/README-etapa01.md, docs/VALIDACAO.md
├── tests/, package.json
└── README.md
```

O ZIP inclui o código e `F1-Pulse.bundle`, com o histórico Git original e os commits desta etapa. Para restaurar um clone pelo pacote:

```bash
git clone F1-Pulse.bundle F1-Pulse-restaurado
cd F1-Pulse-restaurado
git switch etapa02
git remote set-url origin https://github.com/davidmarinho14/F1-Pulse.git
```

**Entrega no Moodle:** enviar este `README.md`, com os três links públicos acima, conforme a apostila. O ZIP é disponibilizado como cópia completa do trabalho.

Projeto desenvolvido para fins acadêmicos.
