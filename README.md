# F1 Pulse — Formula 1 Season Dashboard

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
git clone URL_DO_REPOSITORIO
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
A DEFINIR

## 📦 Repositório

**GitHub:**
A DEFINIR

## 📄 Licença

Projeto desenvolvido para fins acadêmicos.
