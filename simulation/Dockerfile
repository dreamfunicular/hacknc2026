FROM node:24-slim

WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY pnpm-workspace.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

COPY main.ts ./

USER node

CMD ["node", "main.ts"]