FROM zixia/facenet
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
      jq \
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

RUN [ -e /workdir ] || sudo mkdir /workdir \
  && sudo chown -R "$(id -nu)":"$(id -ng)" /workdir
VOLUME /workdir

RUN [ -e /blinder ] || sudo mkdir /blinder \
  && sudo chown -R "$(id -nu)":"$(id -ng)" /blinder
  
WORKDIR /blinder
COPY package.json .
RUN sudo chown "$(id -nu)" package.json \
    && jq 'del(.dependencies.facenet)' package.json | sponge package.json \
    && npm install \
    && rm -fr /tmp/* ~/.npm

COPY . .

CMD [ "npm", "start" ]
