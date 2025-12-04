FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma/schema.postgres.prisma ./prisma/schema.prisma

RUN npm install

COPY . .

RUN npm run build
RUN npx prisma generate

COPY startup.sh .
RUN chmod +x startup.sh

EXPOSE 8080

CMD ["./startup.sh"]
