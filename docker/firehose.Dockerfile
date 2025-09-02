FROM node:24-slim

# Install basic dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV FIREHOSE_PORT=8080

# Expose firehose port
EXPOSE 8080

# Install dependencies when container starts (assumes volume mount)
CMD ["sh", "-c", "npm ci && npx tsx ./firehose/index.ts"]