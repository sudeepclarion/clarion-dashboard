FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG VITE_CLARION_API_URL
ARG VITE_CLARION_API_SECRET
ENV VITE_CLARION_API_URL=$VITE_CLARION_API_URL
ENV VITE_CLARION_API_SECRET=$VITE_CLARION_API_SECRET
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
