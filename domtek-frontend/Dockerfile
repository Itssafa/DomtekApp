FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Sur une connexion instable, npm peut s'interrompre en fin d'installation
# (« Exit handler never called ») tout en rendant un code de sortie nul : les
# paquets sont là, mais pas les liens de node_modules/.bin. Docker mettait
# alors en cache cette couche incomplète, et chaque build suivant échouait plus
# loin sur « next: not found ». La vérification fait échouer l'étape à la place.
RUN npm ci --no-audit --no-fund \
    && test -x node_modules/.bin/next

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]