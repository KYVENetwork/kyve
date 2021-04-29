FROM node:lts-alpine

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

RUN yarn build -- -p tsconfig.docker.json

CMD ["yarn", "start"]
