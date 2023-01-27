FROM node:lts-alpine

RUN apk --no-cache add curl
WORKDIR /code
COPY . .
RUN yarn install
EXPOSE 4200
CMD npm run start-exposed