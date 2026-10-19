# F1 Pulse — Formula 1 Season Dashboard · Etapa 02

> **Estado desta entrega:** Supabase configurado e validado no banco real: criar, consultar, remover, duplicados, estatísticas e restrições de acesso. A interface também passou no fluxo real de salvar/recarregar/remover e gravar histórico. A publicação Docker ainda depende do segredo DOCKERHUB_TOKEN no GitHub. O código é a evolução do mesmo repositório, com histórico preservado. A branch etapa02 está atualizada; main e o Pages continuam na versão anterior, aguardando autorização para atualização.

## Evolução da Etapa 02

O F1 Pulse original foi preservado: HTML, identidade visual, seleção de temporadas, classificação de pilotos e construtores, calendário e pesquisa continuam na aplicação. O ZIP da apostila contém uma Pokédex de exemplo; ela não substituiu este projeto. A documentação anterior está em [docs/README-etapa01.md](docs/README-etapa01.md), e o histórico Git original foi mantido.

Novos recursos implementados:

- Salvar, listar e remover pilotos favoritos diretamente no Supabase por `fetch` e API REST, sem simulação ou armazenamento local na aplicação.
- Favoritos identificados pelo par `piloto_id` + `temporada`, impedindo duplicados sem impedir o mesmo piloto em anos diferentes.
- Lista pública compartilhada, conforme o modelo acadêmico da apostila: qualquer visitante pode consultar, inserir e remover favoritos. Não há conta individual. Não use o histórico para informações privadas.
- Erros de configuração, conexão, timeout, duplicados, permissões e excesso de requisições recebem mensagens na tela.
- Carregamento dos favoritos em páginas de 50 registros; estatísticas agregadas no banco abrangem todos os registros.
- Botão para atualizar dados salvos quando outro visitante alterar a coleção.

### Sidequests implementadas: A e C

- **A — Histórico de buscas:** segunda tabela `historico`, com `insert` e `select`; registra termo, temporada e se houve resultado. Buscas não encontradas ou com falha também são registradas com `encontrado=false`. A interface mostra as últimas cinco buscas, clicáveis, e restaura a temporada antes de repetir a consulta. Busca vazia não é enviada. A gravação ocorre em segundo plano e sua falha não apaga o resultado da consulta. Falha e ausência de resultado compartilham o estado booleano previsto na apostila.
- **C — Estatísticas:** função SQL `estatisticas_favoritos()` calcula total de favoritos, favorito mais recente, equipe mais frequente e quantidade de equipes. Após salvar/remover, o frontend consulta novamente essa função. Em empate de equipes, vence a primeira em ordem alfabética. Os números vêm dos registros persistidos, não da API Jolpica.

As duas sidequests estão cobertas por testes locais com respostas simuladas. As tabelas já foram criadas e a integração real foi validada. O Compose é um recurso extra; a sidequest B não é reivindicada, pois não houve publicação das tags 1.0/1.1.

## Configurar o Supabase real

1. Crie ou abra seu projeto em [Supabase Dashboard](https://supabase.com/dashboard).
2. No SQL Editor, execute **uma vez** [docs/setup_supabase.sql](docs/setup_supabase.sql). O script é transacional e cria tabelas novas; não apaga tabelas existentes. Se já existir uma tabela com esses nomes, revise o esquema antes de adaptar uma migração. Não execute comandos de exclusão para contornar o erro.
3. Nas configurações de API do projeto, copie a URL e a chave pública `anon` ou `sb_publishable_...`.
4. Edite `config.js`:

```js
window.F1_CONFIG = {
  supabaseUrl: "", // substitua pela URL real do seu projeto
  supabaseKey: ""  // substitua pela chave pública real
};
```

O config.js já contém a URL e a chave pública fornecidas pelo autor; para usar outro projeto, substitua esses valores. Nunca coloque `service_role`, `sb_secret_...` ou senha do banco no navegador, no Git ou na imagem. O cliente rejeita chaves sem formato público reconhecido. As chaves públicas ficam visíveis no frontend e sua autorização depende dos grants e do RLS.

### Modelo e permissões

| Objeto | Campos/operação |
| --- | --- |
| `favoritos` | `id`, `criado_em`, `piloto_id`, `temporada`, `nome`, `equipe`, `nacionalidade`; UNIQUE em piloto/temporada |
| `historico` | `id`, `criado_em`, `termo`, `temporada`, `encontrado` |
| `estatisticas_favoritos()` | Agrega os favoritos com `security invoker`; respeita permissões do chamador |

RLS ativo nas duas tabelas. O papel `anon` recebe SELECT/INSERT/DELETE em favoritos e SELECT/INSERT em histórico, além do uso das sequências e execução da função de estatísticas. UPDATE não foi liberado; DELETE do histórico também não. O papel `authenticated` não é usado pela aplicação e não recebe esses acessos. Há validação de tamanho, temporada e identificador no banco. A lista compartilhada é deliberada; para coleções privadas seria necessário adicionar autenticação e políticas por `auth.uid()`.

Documentação: [REST Supabase](https://supabase.com/docs/guides/api), [RLS e grants](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Executar esta versão localmente

```bash
git clone --branch etapa02 https://github.com/davidmarinho14/F1-Pulse.git
cd F1-Pulse
python -m http.server 5500
```

Abra [http://localhost:5500](http://localhost:5500). Também pode usar Live Server. Configure `config.js` para habilitar o banco; sem configuração, as consultas da Jolpica continuam disponíveis e a área persistente explica o que falta. Os caminhos são relativos, compatíveis com o subdiretório `/F1-Pulse/` do Pages.

## Executar com Docker

Pré-requisito: Docker Engine/Desktop em execução, com containers Linux. Configure `config.js` **antes do build**, pois ele é copiado para a imagem. Variáveis `docker run -e` não alteram automaticamente uma aplicação estática. Nunca passe uma chave secreta no build.

```bash
docker build -t f1-pulse:1.0 .
docker run -d --name f1-pulse -p 8080:80 f1-pulse:1.0
```

Abra [http://localhost:8080](http://localhost:8080).

Alternativa com Compose:

```bash
docker compose up --build -d
docker compose down
```

O Dockerfile usa a imagem oficial `nginx:stable-alpine`, copia apenas os arquivos públicos, expõe a porta 80 e verifica a resposta HTTP com um healthcheck. O `.dockerignore` exclui histórico Git, testes, documentos e arquivos de ambiente do contexto. Após mudar arquivos, reconstrua a imagem. O banco permanece no Supabase e não é apagado ao recriar o container.

### Publicar a imagem — pendente

O usuário Docker Hub informado é davidmarinho14; ainda não há imagem publicada. Não há um terceiro link de imagem verificável nesta entrega. Substitua `SEU_USUARIO` abaixo pelo usuário real do Docker Hub; estes comandos são instruções, não evidência de execução:

```bash
docker login
docker tag f1-pulse:1.0 SEU_USUARIO/f1-pulse:1.0
docker tag f1-pulse:1.0 SEU_USUARIO/f1-pulse:latest
docker push SEU_USUARIO/f1-pulse:1.0
docker push SEU_USUARIO/f1-pulse:latest
```

Crie/confira o repositório público no [Docker Hub](https://hub.docker.com/), copie seu endereço real para a seção Links e substitua o usuário no comando de consumo:

```bash
docker run -d -p 8080:80 SEU_USUARIO/f1-pulse:1.0
```

Valide esse último comando em ambiente limpo, depois de publicar. Não foi possível construir ou executar containers nesta sessão porque Docker não está instalado/disponível.

### Publicar pelo GitHub sem instalar Docker

O arquivo `.github/workflows/docker.yml` constrói e verifica o container em cada atualização de `main`. Para publicar as tags `1.0` e `latest`:

1. No Docker Hub, crie o repositório público `davidmarinho14/f1-pulse`.
2. Crie um token de acesso Docker Hub com permissão de leitura e escrita.
3. No GitHub, Settings → Secrets and variables → Actions → New repository secret: nome `DOCKERHUB_TOKEN`, valor igual ao token. Não envie esse token no chat nem o grave em arquivos.
4. Em Actions, abra **Docker - construir e publicar**, clique em **Run workflow** na branch `main`.
5. A ação constrói, testa e publica; outro job, em runner limpo e sem login, baixa e executa a imagem pública.
6. Só depois do sucesso, confirme o endereço da imagem e atualize o status deste README.

## Testes e evidências

Executados localmente em 18/10/2026:

- `node --check script.js`, `node --check db.js`, `node --check persistence.js`: passaram.
- `node --test tests/db.test.cjs`: **3 testes passaram**, cobrindo configuração ausente/chave secreta, requisições CRUD e mensagens para duplicado, acesso negado, limite, erro de servidor, rede e timeout.
- `node tests/browser.cjs`: passou em Chromium/Chrome com rede simulada. Verificou classificação, salvar/listar/remover, recarga da página, duplicado, busca com e sem resultado, repetição do histórico, erro de permissão simulado, texto malicioso renderizado como texto, temporada sem classificação, viewport móvel e ausência de configuração.
- Capturas desktop (1365 px) e móvel (390 px) inspecionadas; teste de largura móvel sem rolagem horizontal.
- Repositório, Pages e endpoint Jolpica de classificação de 2025 responderam HTTP 200. Isso confirma acesso aos links, não implantação da Etapa 02 no Pages.

Para repetir os testes de navegador:

```bash
npm install
npx playwright install chromium
npm test
npm run test:browser
```

Opcional: defina `F1_BROWSER_PATH` com o caminho de um Chrome/Chromium já instalado. O navegador de teste usa servidor HTTP local e intercepta Jolpica/Supabase; nenhum dado de teste é enviado a um banco real. Capturas são gravadas em `test-results/`, ignorado pelo Git.

**Validação adicional com Supabase real:** SELECT nas duas tabelas, INSERT/SELECT/DELETE de favorito temporário, duplicado rejeitado com 23505, UPDATE de favoritos negado, UPDATE/DELETE de histórico negados, função de estatísticas funcionando. Pela interface com APIs reais: salvar, recarregar, remover e registrar/listar histórico passaram. O favorito temporário foi removido; uma busca de piloto permaneceu no histórico. Isso verifica as permissões efetivas da chave pública, sem acesso administrativo ao catálogo RLS. **Ainda não executados:** teste em dois dispositivos físicos e publicação/pull da imagem Docker. Veja [docs/VALIDACAO.md](docs/VALIDACAO.md) para concluir a validação real.

## Git, publicação e recuperação do ZIP

A branch `etapa02` foi criada a partir do histórico original (base `09e27b6`), com pelo menos cinco commits reais incrementais e publicação no mesmo `origin`. Não houve reescrita do histórico nem substituição do projeto por um repositório novo. A evolução mantém o conteúdo e o histórico da Etapa 01 e está preparada para implantação no Pages.

O ZIP final inclui o código e `F1-Pulse.bundle`, que transporta o histórico Git completo. Para recuperar um clone a partir do pacote:

```bash
git clone F1-Pulse.bundle F1-Pulse-restaurado
cd F1-Pulse-restaurado
git switch etapa02
git remote set-url origin https://github.com/davidmarinho14/F1-Pulse.git
```

Para publicar no Pages, finalize configuração e testes reais, integre a branch `etapa02` em `main`, confira a origem configurada em Settings → Pages e aguarde a implantação. Depois valide os fluxos do banco no endereço público. Não declare a Etapa 02 online antes dessa confirmação.

## Links da entrega

- **Mesmo repositório:** [davidmarinho14/F1-Pulse](https://github.com/davidmarinho14/F1-Pulse)
- **Código da Etapa 02:** [branch etapa02](https://github.com/davidmarinho14/F1-Pulse/tree/etapa02)
- **GitHub Pages:** [F1 Pulse](https://davidmarinho14.github.io/F1-Pulse/)
- **Imagem Docker Hub:** pendente de publicação; nenhum endereço de imagem foi inventado.

---

## Documentação original da Etapa 01

## 👨‍💻 Autor

**David Richard Marinho — 22610620**

## 📌 Sobre o projeto

O **F1 Pulse** é um dashboard interativo desenvolvido para acompanhar informações de diferentes temporadas da Fórmula 1.

A aplicação permite consultar dados de pilotos, equipes e corridas de diferentes temporadas, utilizando uma API pública de Fórmula 1.

O projeto foi desenvolvido utilizando **HTML, CSS e JavaScript**, com requisições assíncronas realizadas através do `fetch()`.

## 🔌 API utilizada

O projeto utiliza a **Jolpica F1 API**, uma API pública que fornece dados históricos e atuais relacionados à Fórmula 1.

**Documentação:**
https://github.com/jolpica/jolpica-f1

## 📡 Endpoints utilizados

### Classificação dos pilotos

```text
https://api.jolpi.ca/ergast/f1/{season}/driverstandings/
```

Utilizado para obter a classificação dos pilotos de uma determinada temporada.

### Classificação dos construtores

```text
https://api.jolpi.ca/ergast/f1/{season}/constructorstandings/
```

Utilizado para obter a classificação das equipes/construtores.

### Calendário da temporada

```text
https://api.jolpi.ca/ergast/f1/{season}/races/
```

Utilizado para obter as corridas, rodadas, nomes dos Grandes Prêmios e datas.

### Informações de um piloto

```text
https://api.jolpi.ca/ergast/f1/{season}/drivers/{driverId}/driverstandings/
```

Utilizado na pesquisa de pilotos para consultar informações específicas de um piloto dentro da temporada selecionada.

## ⚙️ Funcionalidades

* Seleção de diferentes temporadas da Fórmula 1.
* Consulta dinâmica dos dados através da API.
* Exibição da classificação dos pilotos.
* Exibição da classificação dos construtores.
* Exibição do calendário da temporada.
* Pesquisa de pilotos.
* Exibição de informações específicas do piloto pesquisado.
* Indicador de rodada atual da temporada.
* Contagem de pilotos encontrados.
* Estados de carregamento durante as requisições.
* Tratamento de erros caso os dados não possam ser carregados.
* Interface responsiva para diferentes tamanhos de tela.

## 🛠️ Tecnologias utilizadas

* HTML5
* CSS3
* JavaScript
* Fetch API
* Jolpica F1 API
* Git
* GitHub Pages

## 💻 Como executar localmente

1. Clone este repositório:

```bash
git clone https://github.com/davidmarinho14/F1-Pulse.git
```

2. Entre na pasta do projeto:

```bash
cd F1-Pulse
```

3. Abra o projeto no Visual Studio Code.

4. Execute o arquivo `index.html` utilizando uma extensão como **Live Server**.

5. O projeto será aberto no navegador através de um endereço local, como:

```text
http://127.0.0.1:5500/index.html
```

## 📁 Estrutura do projeto

```text
F1-Pulse/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

## 🌐 Projeto publicado
**GitHub Pages:**
https://davidmarinho14.github.io/F1-Pulse/

## 📦 Repositório
**GitHub:**
https://github.com/davidmarinho14/F1-Pulse

## 📄 Licença

Projeto desenvolvido para fins acadêmicos.
