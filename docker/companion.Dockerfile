FROM node:24-slim

# Install basic dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Environment variable for companion configuration
ENV COMPANION_CONFIG=polka
ENV NODE_ENV=production

# Expose the companion server port range (4000-4099)
EXPOSE 4000-4099

# Install dependencies when container starts (assumes volume mount)
CMD ["sh", "-c", "npm ci && npx tsx ./configs/$COMPANION_CONFIG/companion.ts"]