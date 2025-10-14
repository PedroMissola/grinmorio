# 1. Use a imagem oficial do Node.js
FROM node:20-alpine

# 2. Defina o diretório de trabalho
WORKDIR /usr/src/app

# 3. Copie os arquivos de dependência
COPY package*.json ./

# 4. Instale as dependências
RUN npm install

# 5. Copie o resto do código-fonte
COPY . .

# 6. O comando padrão para rodar o script principal
CMD ["node", "src/populate-db.js"]
