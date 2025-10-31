#  Grinmório - Assistente de D&D 5e para Discord

**Grinmório** é uma solução completa e robusta para mestres e jogadores de Dungeons & Dragons 5ª Edição, totalmente integrada ao Discord. O projeto utiliza uma arquitetura de microsserviços containerizada com Docker para oferecer uma experiência fluida e poderosa, combinando um bot interativo com um painel de gerenciamento web.

---

## 🚀 Sobre o Projeto

O Grinmório é dividido em quatro componentes principais que trabalham em conjunto:

* **🤖 Bot para Discord (`grinmorio-BOT`):** O coração do projeto. É a interface principal para os usuários no Discord. Permite gerenciar fichas de personagem, realizar rolagens de dados complexas, rastrear iniciativa e consultar informações sobre monstros, magias e itens do universo de D&D 5e.

* **⚙️ API de Backend (`grinmorio-API`):** Construída em Node.js com Express, esta API RESTful serve como o cérebro do sistema. Ela gerencia toda a lógica de negócio, interage com o banco de dados e o cache, e fornece os endpoints que o bot consome.

* **🖥️ Painel de Controle (`grinmorio-DASHBOARD`):** Uma aplicação web em React que serve como um centro de administração. Protegido por autenticação, ele oferece uma visão unificada para gerenciar os serviços subjacentes, como o banco de dados (Mongo Express), o cache (Redis Commander) e os contêineres Docker (Portainer).

* **🕸️ Coletor de Dados (`grinmorio-DATA-SCRAPPER`):** Um script de web scraping que popula o banco de dados MongoDB com informações essenciais de D&D 5e (magias, classes, raças) a partir de wikis online, garantindo que o bot tenha dados ricos para as consultas.

## ✨ Funcionalidades Principais

* **Fichas de Personagem Completas:**
    * Criação de fichas através de um formulário interativo (`/ficha criar`).
    * Visualização completa e navegável da ficha com botões (`/ficha ver`).
    * Edição detalhada de todas as seções da ficha (atributos, status, aparência, história, etc.).
    * Backup da ficha em um arquivo PDF estilizado e preenchível (`/ficha backup`).

* **Sistema de Rolagem Avançado:**
    * Rolagens de dados diretamente no chat (`1d20+5`, `2d6+1d8`).
    * Suporte para Vantagem e Desvantagem (`vantagem+3`).
    * Rolagens múltiplas para ataques (`3#1d20+4`).
    * Rastreamento de iniciativa simplificado (`iniciativa(+2)`, `listariniciativas`).

* **Consultas Rápidas de D&D 5e:**
    * Busque informações sobre monstros, magias, itens e habilidades de classe com comandos simples.

* **Painel de Administração Centralizado:**
    * Acesso seguro para administrar o ecossistema do projeto.
    * Interfaces web para gerenciar o banco de dados, cache e contêineres Docker.

## 🛠️ Arquitetura e Tecnologias

O projeto é construído sobre uma arquitetura de microsserviços, orquestrada pelo `docker-compose.yml`, garantindo isolamento, escalabilidade e facilidade de gerenciamento.

| Serviço | Tecnologias Utilizadas |
| :--- | :--- |
| **Bot (grinmorio-BOT)** | Node.js, Discord.js, Axios |
| **API (grinmorio-API)** | Node.js, Express, MongoDB, Redis, JWT, bcryptjs, pdf-lib |
| **Dashboard (grinmorio-DASHBOARD)** | React, Vite, TailwindCSS, Axios, Nginx |
| **Data Scrapper** | Node.js, Cheerio, Axios, MongoDB |
| **Banco de Dados** | MongoDB |
| **Cache** | Redis |
| **Gerenciamento** | Portainer, Mongo Express, Redis Commander |

## 🏁 Como Começar

Para executar o projeto localmente, você precisa ter o Docker e o Docker Compose instalados.

### 1. Configuração do Ambiente

Clone o repositório e crie um arquivo `.env` na raiz do projeto (`grinmorio/`), copiando o conteúdo abaixo.

```env
# Variáveis para a criação inicial do usuário no MongoDB
MONGO_INITDB_ROOT_USERNAME=dnduser
MONGO_INITDB_ROOT_PASSWORD=dndsecret

# Variáveis que serão usadas pela API e pelo Scraper para se conectar
MONGO_USER=dnduser
MONGO_PASSWORD=dndsecret
MONGO_DB_NAME=dnd
MONGO_PORT=27017

PORT=3000

# Variaveis que serão usadas pelo Bot para se conectar
DISCORD_TOKEN=SEU_TOKEN_DO_DISCORD_AQUI
CLIENT_ID=SEU_CLIENT_ID_DO_BOT_AQUI
API_BASE_URL=http://api:3000/api

JWT_SECRET=dndsecret
````

**Importante:** Substitua `SEU_TOKEN_DO_DISCORD_AQUI` e `SEU_CLIENT_ID_DO_BOT_AQUI` pelas credenciais do seu bot do Discord.

### 2\. Executando os Contêineres

Com o Docker em execução, navegue até a pasta raiz do projeto e execute o seguinte comando:

```bash
docker-compose up -d
```

Este comando irá construir as imagens e iniciar todos os serviços em segundo plano.

### 3\. Populando o Banco de Dados

Para que os comandos de consulta funcionem, você precisa popular o banco de dados com o Scraper. Execute o seguinte comando para cada tipo de dado que deseja coletar:

```bash
# Para coletar dados de magias
docker-compose run --rm scraper node src/populate-db.js spells

# Para coletar dados de raças/linhagens
docker-compose run --rm scraper node src/populate-db.js lineages

# Para coletar dados de classes e subclasses
docker-compose run --rm scraper node src/populate-db.js classes
```

## Como usar

  * **Bot do Discord:** Convide o bot para o seu servidor e comece a usar os comandos com `/`.
  * **Painel de Controle:** Acesse `http://localhost:8080` no seu navegador. As interfaces de gerenciamento estarão disponíveis nos seguintes caminhos:
      * `/portainer/` - Gerenciador de contêineres.
      * `/mongo/` - Gerenciador do MongoDB.
      * `/redis/` - Gerenciador do Redis.

Para acessar o painel, você precisará criar um usuário administrador. Conecte-se ao contêiner da API e execute o script:

```bash
# Encontre o ID do contêiner da API
docker ps

# Execute o script dentro do contêiner
docker exec -it <ID_DO_CONTÊINER_API> node create-admin.js
```
