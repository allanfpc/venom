FROM node:18-slim

# Instalar dependências do sistema e Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
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
    libxshmfence1 \
    libxss1 \
    xdg-utils \
    libgbm-dev \
    libu2f-udev \
    curl \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Instalar o Google Chrome
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos
COPY . .

# Instalar dependências
RUN npm install

# Criar diretório de uploads
RUN mkdir -p /app/uploads

# Expor a porta usada
EXPOSE 3000

# Define variáveis de ambiente necessárias
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Iniciar aplicação
CMD ["node", "index.js"]
