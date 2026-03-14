FROM node:20-alpine
#Dossier dans le container (reçoit le COPY . .)
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
# port d'écoute (juste documentation)
EXPOSE 3001
# Démarre en mode wtach (hot reload)
CMD ["npm", "run" ,"start:dev"]

