# Usar uma imagem Node leve
FROM node:18-slim

# Instalar dependências do sistema para o Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar os arquivos da aplicação
COPY . .

# Instalar dependências
RUN npm install

# Expor a porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
