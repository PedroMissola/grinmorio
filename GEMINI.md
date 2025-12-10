# Project Grinmório

## Project Overview

Grinmório is a comprehensive and robust solution for Dungeons & Dragons 5th Edition masters and players, fully integrated with Discord. The project uses a containerized microservices architecture with Docker to offer a fluid and powerful experience, combining an interactive bot with a web management panel.

The project is divided into four main components that work together:

*   **Discord Bot (`grinmorio-BOT`):** The heart of the project. It is the main interface for users on Discord. It allows you to manage character sheets, perform complex dice rolls, track initiative, and consult information about monsters, spells, and items from the D&D 5e universe. This service is built with Node.js and Discord.js.

*   **Backend API (`grinmorio-DATABASE`):** Built in Node.js with Express, this RESTful API serves as the brains of the system. It manages all the business logic, interacts with the database and cache, and provides the endpoints that the bot consumes.

*   **Database:** A MongoDB instance for data persistence.

*   **Cache:** A Redis instance for caching.

## Building and Running

To run the project locally, you need to have Docker and Docker Compose installed.

### 1. Environment Setup

Clone the repository and create a `.env` file in the project root (`grinmorio/`), copying the contents below.

```env
# Variables for the initial creation of the user in MongoDB
MONGO_INITDB_ROOT_USERNAME=dnduser
MONGO_INITDB_ROOT_PASSWORD=dndsecret

# Variables that will be used by the API and the Scraper to connect
MONGO_USER=dnduser
MONGO_PASSWORD=dndsecret
MONGO_DB_NAME=dnd
MONGO_PORT=27017
MONGO_URI=mongodb://dnduser:dndsecret@mongo-db:27017/dnd?authSource=admin

REDIS_URI=redis://redis-db:6379

PORT=3000

# Variables that will be used by the Bot to connect
DISCORD_TOKEN=YOUR_DISCORD_TOKEN_HERE
CLIENT_ID=YOUR_BOT_CLIENT_ID_HERE
API_BASE_URL=http://api:3000/api

JWT_SECRET=dndsecret
```

**Important:** Replace `YOUR_DISCORD_TOKEN_HERE` and `YOUR_BOT_CLIENT_ID_HERE` with your Discord bot's credentials.

### 2. Running the Containers

With Docker running, navigate to the project's root folder and run the following command:

```bash
docker-compose up -d
```

This command will build the images and start all services in the background.

## Development Conventions

The project follows the standard JavaScript conventions. There are no specific linting or formatting configurations in the provided files. The code is structured in a modular way, with a clear separation of concerns between the different services.
