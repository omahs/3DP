FROM node:18.7

WORKDIR /app

COPY ./miner-libs/ /app/miner-libs/
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
COPY ./miner.js /app/miner.js

RUN yarn install

CMD exec yarn miner --host node --interval $INTERVAL
