FROM rickydunlop/nodejs-ffmpeg:latest

# Create app directory
WORKDIR /opt/crosscode-bot

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apk add --no-cache --virtual .gyp \
        git \
        python \
        make \
        g++ \
    && npm install \
    && apk del .gyp git python make g++

# Bundle app source
COPY . .

CMD [ "node", "index.js" ]
