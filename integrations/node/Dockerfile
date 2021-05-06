FROM node:lts-alpine

RUN apk add --no-cache python g++ make

COPY package.json .
COPY yarn.lock .

RUN apk --no-cache --virtual build-dependencies add \
	python \
        make \
        g++

RUN yarn install

COPY . .

RUN yarn build -p tsconfig.docker.json

CMD ["yarn", "start"]
