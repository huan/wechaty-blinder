FROM zixia/facenet

RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    fontconfig-config \
    fonts-arphic-ukai \
    fonts-dejavu-core \
    fonts-wqy-zenhei \
    libfontconfig1 \
    ttf-wqy-zenhei \
    ucf \
    && rm -rf /tmp/* /var/lib/apt/lists/*

RUN sudo mkdir /app/ \
    && sudo chown -R bot:bot /app/
WORKDIR /app/

ENV NODE_ENV $NODE_ENV

COPY package.json .
RUN npm install && npm cache clean && rm -fr /tmp/* ~/.npm
COPY . .

CMD [ "npm", "start" ]


