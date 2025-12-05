FROM node:20-alpine

# Install OpenSSL (required for Prisma) and build tools for bcrypt
RUN apk -U add openssl python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

COPY startup.sh .
RUN chmod +x startup.sh

EXPOSE 8080

CMD ["./startup.sh"]
