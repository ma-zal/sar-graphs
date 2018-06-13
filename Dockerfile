FROM node:8-stretch


EXPOSE 1080/tcp


USER root:root

# Instal sysstat 11.x
RUN apt update && apt install sysstat -y

# Prepare empty directories: /app
USER root:root
RUN mkdir -p /app/public

# Build app
WORKDIR /app
# Copy app src to /app-src
COPY src/package.json /app/package.json
# Run build && copy dist to final directory
RUN npm install

# Copy app src to /app
COPY src/ /app


# Run app
ENV NODE_ENV=production
CMD ["node", "app.js"]
