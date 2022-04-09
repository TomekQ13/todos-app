FROM node:14-alpine

COPY package-lock.json package.json ./
RUN npm install
COPY . .

CMD ["npm", "run", "app.js"]
