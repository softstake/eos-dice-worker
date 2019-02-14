FROM node:10.14.2 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g typescript
RUN tsc

FROM node:11.9.0-alpine as production-stage
WORKDIR /app
COPY --from=build-stage /app .
RUN rm -rf node_modules/massive/node_modules/pg-promise node_modules/demux-postgres/node_modules/pg-promise 
CMD ["node", "index.js"]