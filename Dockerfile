FROM node:20-alpine
WORKDIR /app

# Install build dependencies needed for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

# Copy everything besides node_modules
COPY tsconfig.json ./
COPY src/ ./src/
COPY db/ ./db/

# Create directory for SQLite database (if it doesn't exist)
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]

