FROM node:slim

WORKDIR /app
COPY package* /app/
RUN npm i
COPY . /app
CMD ["npm", "run", "start"]
