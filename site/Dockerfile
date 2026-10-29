# hypertag.trade static site: nginx as a non-root user on port 4973.
# Dokploy: Build Type "Dockerfile", Dockerfile path site/Dockerfile,
# Docker context path site, and set the domain's container port to 4973.
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

EXPOSE 4973

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4973/healthz || exit 1
