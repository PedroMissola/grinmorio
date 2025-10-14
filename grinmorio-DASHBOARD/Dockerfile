# Estágio 1: Build da aplicação React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir os ficheiros estáticos com Nginx
FROM nginx:alpine
# Copia os ficheiros construídos do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Copia uma configuração Nginx para lidar com o roteamento do React
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]