FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install instead of npm ci (doesn't require package-lock.json)
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production server with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
