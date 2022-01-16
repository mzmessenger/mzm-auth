# https://hub.docker.com/_/node
FROM node:16

WORKDIR /usr/app

RUN apt-get update -y && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

COPY ./package.json ./package-lock.json tsconfig.json ./
COPY src/ ./src

RUN npm install --production && npm install typescript && npm run cleanbuild

ENV NODE_ENV=production
CMD [ "node", "dist/server.js" ]