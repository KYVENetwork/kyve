FROM node:lts-alpine

COPY package.json .

RUN apk --no-cache --virtual build-dependencies add python make g++ libtool autoconf automake git

RUN yarn install

COPY . .

RUN yarn build -p tsconfig.docker.json

CMD ["yarn", "start"]
