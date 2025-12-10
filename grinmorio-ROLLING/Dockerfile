# 1. Base Image
FROM node:20-alpine AS base
WORKDIR /app

# 2. Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# 3. Prisma
FROM base AS prisma
COPY --from=deps /app/node_modules /app/node_modules
COPY package.json package-lock.json ./
COPY src/prisma/schema.prisma ./src/prisma/
RUN npm install --only=dev
RUN npx prisma generate

# 4. Build
FROM base AS build
COPY --from=prisma /app/node_modules /app/node_modules
COPY . .

# 5. Production Image
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/src /app/src

EXPOSE 3001
CMD ["node", "src/server.js"]
