ARG NGINX_VERSION=1.28

# FROM nginx:${NGINX_VERSION}
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}
LABEL maintainer=contact@kalisio.xyz
# Copy generated site
COPY . /app
# Remove default nginx site + add conf for doc site
USER root
RUN rm /etc/nginx/conf.d/default.conf && mv /app/nginx.conf /etc/nginx/conf.d/doc.conf
USER 101