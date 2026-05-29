FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm cache clean --force && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]