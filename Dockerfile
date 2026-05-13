FROM node:24-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build
# Strip dev deps in place so the runtime stage can copy node_modules
# wholesale and avoid reinstalling (and avoid shipping the toolchain).
RUN npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist/client ./dist/client
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/tsconfig.base.json ./
EXPOSE 3000
ENV DB_PATH=/data/altplayer.sqlite
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
VOLUME ["/data"]
CMD ["node_modules/.bin/tsx", "server/index.ts"]
