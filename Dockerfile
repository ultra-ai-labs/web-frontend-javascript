# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies. If package-lock.json is missing fall back to `npm install`.
# Copy package.json first to leverage Docker layer caching.
# Copy package files (will copy package-lock.json if present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
			npm ci --silent; \
		else \
			npm install --silent; \
		fi

# Copy source files
COPY public ./public
COPY src ./src

# Allow build-time injection of API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
# Increase memory limit for the build
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV CI=true
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage: serve with nginx
FROM nginx:stable-alpine
# Remove default site config and add our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy build artifacts
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
