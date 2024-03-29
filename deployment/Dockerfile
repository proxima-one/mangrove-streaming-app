# syntax=docker/dockerfile:1.3

FROM node:16-alpine3.15 as build

WORKDIR /app
COPY ./package.json ./

RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc \
    yarn install

COPY . .

RUN yarn build

FROM node:16-alpine3.15 as prod
ARG BUILD_VERSION
WORKDIR /app
RUN apk add dumb-init
COPY ./package.json ./

ENV NODE_ENV production
RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc \
  yarn install --production --ignore-optional

COPY --from=build /app/dist .
ENV NODE_PATH /app
ENV VERSION $BUILD_VERSION
ENTRYPOINT ["dumb-init", "node", "./index.js"]
