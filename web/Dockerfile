# Imagen de producción de la web (Next.js en modo standalone).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
# Las variables NEXT_PUBLIC_* se incrustan al compilar.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ARCHIVOS_URL
ARG NEXT_PUBLIC_EMPRESA_NOMBRE
ARG NEXT_PUBLIC_EMPRESA_RAZON_SOCIAL
ARG NEXT_PUBLIC_EMPRESA_RUC
ARG NEXT_PUBLIC_EMPRESA_DIRECCION
ARG NEXT_PUBLIC_EMPRESA_CORREO
ARG NEXT_PUBLIC_EMPRESA_CORREO_PRIVACIDAD
ARG NEXT_PUBLIC_EMPRESA_CIUDAD
ARG NEXT_PUBLIC_EMPRESA_HOSTING
ARG NEXT_PUBLIC_LEGAL_REVISADO
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN adduser -S -u 10001 web
COPY --from=build --chown=web /app/.next/standalone ./
COPY --from=build --chown=web /app/.next/static ./.next/static
COPY --from=build --chown=web /app/public ./public
USER web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/login >/dev/null || exit 1
CMD ["node", "server.js"]
