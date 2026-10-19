FROM nginx:stable-alpine
COPY index.html style.css script.js config.js db.js persistence.js /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
