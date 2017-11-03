FROM zixia/wechaty
LABEL maintainer="Huan LI <zixia@zixia.net>"

RUN sudo apt-get update \
    && sudo apt-get install -y --no-install-recommends \
      build-essential \
      fontconfig \
      fontconfig-config \
      fonts-arphic-ukai \
      fonts-dejavu-core \
      fonts-wqy-zenhei \
      git \
      libcairo2-dev \
      libfontconfig1 \
      libgif-dev \
      libjpeg8-dev \
      libpango1.0-dev \
      moreutils \
      python2.7 \
      python3-venv \
      ttf-freefont \
      ttf-wqy-zenhei \
      ucf \
    && sudo rm -rf /tmp/* /var/lib/apt/lists/* \
    && sudo apt-get purge --auto-remove

RUN sudo mkdir /workdir \
    && sudo chown -R bot:bot /workdir
VOLUME /workdir

WORKDIR /bot
COPY package.json .
RUN sudo chown bot package.json \
    && jq 'del(.dependencies.wechaty)' package.json | sponge package.json \
    && npm install \
    && rm -fr /tmp/* ~/.npm

COPY . .

CMD [ "npm", "start" ]
