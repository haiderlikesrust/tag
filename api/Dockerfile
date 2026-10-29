# Hypertag AI service. Dokploy: build path /api, Dockerfile "Dockerfile",
# domain hypertag.trade with path /api, container port 4975.
# Set OPENROUTER_API_KEY (and optionally OPENROUTER_MODEL) in Dokploy's
# Environment tab. Never commit the key.
FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs ./
ENV NODE_ENV=production PORT=4975
USER node
EXPOSE 4975
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4975/api/health || exit 1
CMD ["node", "server.mjs"]
