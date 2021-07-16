FROM node:lts-alpine

COPY package.json .
COPY yarn.lock .

RUN apk --no-cache --virtual build-dependencies add python make g++ libtool autoconf automake

RUN yarn install

COPY . .

RUN yarn build -p tsconfig.docker.json

CMD ["yarn", "start"]
