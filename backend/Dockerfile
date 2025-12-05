FROM node:20-alpine

# Install OpenSSL (required for Prisma on Alpine)
RUN apk -U add openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma/schema.postgres.prisma ./prisma/schema.prisma

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

COPY startup.sh .
RUN chmod +x startup.sh

EXPOSE 8080

CMD ["./startup.sh"]
