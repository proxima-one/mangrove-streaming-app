# syntax=docker/dockerfile:1.3

FROM node:14-alpine as build

WORKDIR /app
COPY ./package.json ./

RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc \
    yarn install

COPY . .

RUN yarn build

FROM node:14-alpine as prod
ARG BUILD_VERSION
WORKDIR /app
RUN npm install -g pm2
COPY ./package.json ./

ENV NODE_ENV production
RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc \
  yarn install --production --ignore-optional

COPY --from=build /app/dist ./
ENV VERSION $BUILD_VERSION
ENTRYPOINT ["pm2-runtime", "index.js"]
