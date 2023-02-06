FROM node:18 AS deps

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN corepack enable && \
  corepack prepare yarn@stable --activate

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json .yarnrc.yml yarn.lock ./
COPY .yarn/ ./.yarn/

RUN yarn install --immutable

FROM node:18 AS build

RUN corepack enable && \
  corepack prepare yarn@stable --activate

# Create app directory
WORKDIR /usr/src/app

COPY src/ ./src
COPY prisma/ ./
COPY tsconfig.json ./
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/.yarn ./.yarn
COPY --from=deps /usr/src/app/package.json /usr/src/app/.yarnrc.yml /usr/src/app/yarn.lock ./

RUN yarn prisma generate && \
  yarn build

FROM node:18-slim

ENV DATABASE_URL="postgresql://dev:dev@ebk-ml-postgres:5432/dev?schema=public"
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN corepack enable && \
  corepack prepare yarn@stable --activate

# Create app directory
WORKDIR /usr/src/app

RUN groupadd nodejs && \
  useradd -ms /bin/bash -g nodejs nodejs

USER nodejs

COPY --chown=nodejs:nodejs prisma/ ./
COPY --chown=nodejs:nodejs --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /usr/src/app/dist ./
COPY --chown=nodejs:nodejs --from=deps /usr/src/app/.yarn/ ./.yarn/
COPY --chown=nodejs:nodejs --from=deps /usr/src/app/package.json /usr/src/app/.yarnrc.yml /usr/src/app/yarn.lock ./

CMD [ "yarn", "crawl:prod" ]