###############################################################################
# Stage 1 – BUILD the Meteor bundle
###############################################################################
FROM node:23.11-alpine AS builder

# 1. Prepare work dir
WORKDIR /app

# 2. Install prerequisites packages
RUN apt update && apt install -y python3 make g++ curl bash

# 3. Copy ONLY the Meteor release file first (for better cache utilisation)
COPY .meteor/release .meteor/release

# 4. Install the exact Meteor version required by the project
#    .meteor/release looks like "METEOR@3.2.1"  → we extract "3.2.1"
RUN set -e; \
    METEOR_VERSION=$(grep -o 'METEOR@[0-9.]*' .meteor/release | cut -d'@' -f2); \
    echo "Installing Meteor $METEOR_VERSION"; \
    curl --silent --show-error --fail https://install.meteor.com/?release=${METEOR_VERSION} | bash

# 5. Install server-side deps (works with or without lockfile)
COPY package.json package-lock.json ./
COPY .meteor .meteor
RUN meteor npm install --no-audit --no-fund

# 6. Copy the rest of the source *after* installing dependencies
COPY . .

# 7. Build a server-only bundle
RUN meteor build --directory /opt/build --server-only --allow-superuser


###############################################################################
# Stage 2 – RUNTIME image
###############################################################################
FROM node:23.11-slim

ENV NODE_ENV=production \
    PORT=3000

# 8. Copy built bundle
WORKDIR /app
COPY --from=builder /opt/build/bundle/ ./

# 9. Install bundle’s NPM deps (only production)
RUN npm install --omit=dev --prefix ./programs/server

EXPOSE 3000
CMD ["node", "main.js"]
