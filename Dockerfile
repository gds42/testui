# ====== Stage 1: сборка ======
FROM node:25-alpine AS build

WORKDIR /app

# Устанавливаем зависимости
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Копируем исходники
COPY . .

# Сборка продовой версии
RUN npm run build

# ====== Stage 2: nginx для отдачи статики ======
FROM nginx:1.27-alpine

# Удаляем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Кладём наш конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранный билд
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]