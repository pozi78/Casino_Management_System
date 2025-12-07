
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (Vite default)
EXPOSE 5173

# Run in dev mode (host 0.0.0.0 to be accessible)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
