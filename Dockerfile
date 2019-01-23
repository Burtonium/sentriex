FROM node:11-alpine

LABEL maintainer Matt Burton <matt@burtonize.me>

# Create app directory
WORKDIR /usr/app

RUN npm install pm2 -g

# Install app dependencies
COPY package*.json ./

# add dependencies
RUN apk add --no-cache --virtual .gyp python make g++ \
    && npm install

# If you are building your code for production
# RUN npm install --only=production

# Add application files
ADD . /usr/app

# Entrypoint script
RUN cp docker-entrypoint.sh /usr/local/bin/ && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001 9229

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
