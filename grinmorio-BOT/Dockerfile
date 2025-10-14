# 1. Escolha uma imagem base oficial do Node.js (versões LTS são boas escolhas)
FROM node:20-alpine

# 2. Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# 3. Copie o package.json e package-lock.json para o contêiner
# Copiar esses arquivos primeiro aproveita o cache do Docker.
# As dependências só serão reinstaladas se esses arquivos mudarem.
COPY package*.json ./

# 4. Instale as dependências do projeto
# Para produção, 'npm ci' é mais rápido e seguro. Para desenvolvimento, 'npm install' funciona bem.
RUN npm install

# 5. Copie todo o resto do código do projeto para o contêiner
COPY . .

# 6. Comando para iniciar sua aplicação "cérebro"
CMD ["node", "index.js"]