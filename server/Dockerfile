FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
# This machine's network sits behind a TLS-inspecting gateway (Cloudflare
# WARP/Gateway) whose root CA is trusted by the host OS but not by this
# container's own trust store — without it, outbound HTTPS to Groq/DuckDuckGo
# fails with SELF_SIGNED_CERT_IN_CHAIN. Extend Node's trust store with it.
COPY cloudflare-gateway-ca.pem /usr/local/share/ca-certificates/cloudflare-gateway-ca.pem
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/cloudflare-gateway-ca.pem
EXPOSE 3001
CMD ["node", "src/index.js"]
