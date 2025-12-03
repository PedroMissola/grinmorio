# Usar uma imagem base do Node.js
FROM node:18-alpine

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o resto dos arquivos da aplicação
COPY . .

# Expor a porta que a API vai usar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
