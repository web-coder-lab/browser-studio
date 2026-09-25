FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* .npmrc ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .
RUN npm run build
ENV TRUST_PROXY=true
EXPOSE 3000
CMD ["node", "server.cjs"]
