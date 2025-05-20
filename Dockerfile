FROM node:24-bullseye-slim

# from https://github.com/jshimko/meteor-launchpad/issues/151

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and set permissions
RUN useradd --create-home --shell /bin/bash meteoruser
WORKDIR /opt/meteor
COPY . .

RUN chown -R meteoruser:meteoruser /opt/meteor
RUN mkdir -p /opt/dist && chown -R meteoruser:meteoruser /opt/dist

# Switch to the non-root user
USER meteoruser

# Install Meteor using npx and other dependencies
RUN npx meteor
RUN npm ci

# Build the Meteor application
RUN /home/meteoruser/.meteor/meteor build --directory /opt/dist --server-only

# Install server dependencies for the built app
RUN cd /opt/dist/bundle/programs/server && npm install --omit=dev --verbose

# Expose the Meteor default port
EXPOSE 3000

# Switch to the non-root user for running the app
USER meteoruser
WORKDIR /opt/dist/bundle

# Start the Meteor application
CMD ["node", "main.js"]
