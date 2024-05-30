FROM oven/bun:latest

WORKDIR /app

RUN apt upgrade -y
RUN apt update -y

# Download whatsapp-web.js because bun install fails doing it.
RUN apt install -y git

# Install puppeteer dependencies
RUN apt install -y chromium
RUN apt install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Install dependencies
ADD bot/package.json bot/bun.lockb ./
RUN bun run prepare
RUN bun install --no-save --production

# Add sources and run
ADD bot/src src/

ENV NODE_ENV production

ENTRYPOINT [ "bun" ]
CMD [ "run", "./src" ]
