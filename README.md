# ESO Backend

API backend desenvolvida em **Node.js** com **NestJS** e banco de dados **PostgreSQL**.  
O projeto consome dados de uma API externa do fortnite, persiste essas informações em banco e utiliza **jobs agendados (cron)** para processamento recorrente.


## Descrição

O **ESO Backend** é uma API construída com **NestJS**  que utiliza **PostgreSQL** como banco de dados principal.

Foi realizada o deploy em desenvolvimento da aplicação utilizando o **Render**.

Principais responsabilidades:

- Consumir dados de uma **API externa**;
- Persistir as informações em banco de dados;
- Disponibilizar endpoints para consumo interno/externo;
- Processar dados de forma recorrente através de **jobs cron**.

---

## Tecnologias

- **Node.js**
- **NestJS**
- **PostgreSQL**
- **TypeScript**
- **Docker / Docker Compose**

---

## Requisitos

Antes de rodar o projeto, é importante ter instalado:

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- NPM ou Yarn
- [Docker](https://www.docker.com/) e Docker Compose
- Uma instância do **PostgreSQL** acessível (local ou via Docker)

---

## Fluxo de inicialização

Para realizar a execução do projeto é recomendado realizar os seguintes passos:

Local:

- criação de um banco de dados chamado eso
- npm install
- npm run migration:run (executar o comando somente após a criação do banco de dados)
- npm run start:dev
- após iniciado o projeto é necessário fazer a requisição no seguinte end point para realizar a chamada da api externa do fortnite para a relização do cron automatizado: POST http://localhost:3001/sync/run, segue também o curl da requisição **curl --location --request POST 'http://localhost:3001/sync/run'**
- após realizado a requisição o projeto está pronto para uso

Docker:

- executar docker Compose up no arquivo docker-compose.yml
- npm run migration:run (executar o comando somente após a criação do banco de dados)
- npm run start:dev
- após iniciado o projeto é necessário fazer a requisição no seguinte end point para realizar a chamada da api externa do fortnite para a relização do cron automatizado: POST http://localhost:3001/sync/run, segue também o curl da requisição **curl --location --request POST 'http://localhost:3001/sync/run'**
- após realizado a requisição o projeto está pronto para uso

---

## Configuração de ambiente

Na **raiz do projeto**, é necessário criar **dois arquivos** de variáveis de ambiente:

- `.env`  usado para execução **local**
- `.env.development` usado para execução via **Docker**

```env
# Arquivo: .env  /  .env.development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=admin
DB_NAME=eso
JWT_SECRET=a8788c99b7f87f1d1288d6b354065223660e50e9d6d3b22a0ec390c8d7c6db85
PORT=3001
SYNC_ENABLED=true
SYNC_EVERY_MINUTES=15
DEV_SYNC_TOKEN=dev-only-secret

