FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements et installer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Créer le dossier uploads
RUN mkdir -p uploads && chmod 755 uploads

# Installer curl pour healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Exposer le port
EXPOSE 8001

# Lancer uvicorn en production
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]

