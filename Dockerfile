# Stufe 1: statischen Build erzeugen (keine npm-Abhängigkeiten nötig)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY scripts/build.mjs ./scripts/
COPY public ./public
COPY data ./data
RUN node scripts/build.mjs

# Stufe 2: nur die statischen Dateien mit nginx ausliefern (~10 MB Image, unprivilegiert, Port 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
