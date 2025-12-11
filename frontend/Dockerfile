FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Force cache invalidation
ARG CACHEBUST=1


COPY . .
# Ensure VITE_API_URL is empty or relative so it uses the proxy
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
