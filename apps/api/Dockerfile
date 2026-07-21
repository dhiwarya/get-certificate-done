FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm install
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN npm run build -w @progress/contracts && npm run build -w @progress/api

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/contracts packages/contracts
COPY --from=build /app/apps/api apps/api
CMD ["npm", "run", "start", "-w", "@progress/api"]
