###############################################################################
# Stage 1 – BUILD the Meteor bundle
###############################################################################
FROM node:20-bullseye AS builder

# 1. Prepare work dir
WORKDIR /app

# 2. Copy ONLY the Meteor release file first (for better cache utilisation)
COPY .meteor/release .meteor/release

# 3. Install the exact Meteor version required by the project
#    .meteor/release looks like "METEOR@3.2.1"  → we extract "3.2.1"
RUN set -e; \
    METEOR_VERSION=$(grep -oP 'METEOR@\K[0-9.]*' .meteor/release); \
    echo "Installing Meteor $METEOR_VERSION"; \
    curl --silent --show-error --fail https://install.meteor.com/?release=${METEOR_VERSION} | bash

# 4. Copy the rest of the source *after* installing Meteor
COPY . .

# 5. Build prerequisites for node-gyp packages
RUN apt-get update && apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# 6. Install server-side deps (works with or without lockfile)
RUN meteor npm install --no-audit --no-fund

# 7. Build a server-only bundle
RUN meteor build --directory /opt/build --server-only --allow-superuser


###############################################################################
# Stage 2 – RUNTIME image
###############################################################################
FROM node:20-slim

ENV NODE_ENV=production \
    PORT=3000

# 8. Copy built bundle
WORKDIR /app
COPY --from=builder /opt/build/bundle/ ./

# 9. Install bundle’s NPM deps (only production)
RUN npm install --omit=dev --prefix ./programs/server

EXPOSE 3000
CMD ["node", "main.js"]
