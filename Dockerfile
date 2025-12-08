# syntax=docker/dockerfile:1

FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN rm -rf node_modules && npm install --omit=dev && npm install webpack-node-externals
RUN apk --no-cache add curl && curl -fsS https://dotenvx.sh | sh && dotenvx ext prebuild
RUN npm run build
CMD ["dotenvx", "run", "--", "npm", "run", "start"]
EXPOSE 3000