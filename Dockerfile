FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build
# Strip dev deps in place so the runtime stage can copy node_modules
# wholesale and avoid reinstalling (and avoid shipping the toolchain).
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/shared ./shared
COPY --from=build /app/drizzle.config.ts ./
EXPOSE 3000
ENV DB_PATH=/data/altplayer.sqlite
ENV NODE_ENV=production
ENV PORT=3000
VOLUME ["/data"]
CMD ["node", "dist/server/server/index.js"]
