FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package.json yarn.lock* package-lock.json* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; fi

# Copier le reste du code
COPY . .

# Build de production
ARG REACT_APP_BACKEND_URL=/api
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN npm run build

# Stage final : copier le build dans un volume
FROM alpine:latest

RUN apk add --no-cache bash

WORKDIR /app

# Copier le build depuis le stage builder dans un dossier temporaire
COPY --from=builder /app/build /app/build

# Script qui copie le build dans le volume au démarrage
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'cp -r /app/build/* /output/' >> /entrypoint.sh && \
    echo 'chmod -R 755 /output' >> /entrypoint.sh && \
    echo 'exec sleep infinity' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

