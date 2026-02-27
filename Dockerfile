# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies. If package-lock.json is missing fall back to `npm install`.
# Copy package.json first to leverage Docker layer caching.
COPY package.json ./
# copy package-lock.json if present (will be ignored if missing)
COPY package-lock.json ./ 2>/dev/null || true
RUN if [ -f package-lock.json ]; then \
			npm ci --silent; \
		else \
			npm install --silent; \
		fi

# Copy source and build
COPY . .
# Allow build-time injection of API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# Production stage: serve with nginx
FROM nginx:stable-alpine
# Remove default site config and add our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy build artifacts
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
