# syntax=docker/dockerfile:1

FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN rm -rf node_modules/ && yarn install --production && npm install webpack-node-externals
CMD ["npm", "run", "development"]
EXPOSE 3000