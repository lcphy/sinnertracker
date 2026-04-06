FROM node:20-alpine

RUN adduser -D -u 1001 appuser
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER appuser
CMD ["node", "index.js"]
