FROM node:24-alpine

WORKDIR /app

COPY . .

WORKDIR /app/companion-server
RUN npm install

WORKDIR /app/registry-server
RUN npm install

WORKDIR /app/companion-server

CMD npm run dev;