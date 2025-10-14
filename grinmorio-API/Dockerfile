# --- Estágio 1: Build ---
# Usamos uma imagem completa para instalar todas as dependências
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala TODAS as dependências, incluindo as de desenvolvimento (se houver)
RUN npm install

# Copia o restante do código-fonte
COPY . .

# (Opcional) Se você tivesse um passo de build (ex: Typescript), ele viria aqui
# RUN npm run build

# --- Estágio 2: Produção ---
# Usamos uma imagem limpa e leve para a versão final
FROM node:20-alpine

WORKDIR /app

# Cria um usuário não-root para rodar a aplicação por segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copia apenas as dependências de produção do estágio de build
COPY --from=builder /app/node_modules ./node_modules
# Copia o código-fonte da aplicação
COPY --from=builder /app .

# Expõe a porta que a aplicação usa DENTRO do container
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]