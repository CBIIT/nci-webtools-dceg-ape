FROM nvidia/cuda:12.8.1-cudnn-runtime-rockylinux9

RUN dnf -y update \
    && dnf -y install \
    gcc-c++ \
    mesa-libGL \
    python3.12-devel \
    python3.12-pip \
    nodejs \
    && dnf clean all

RUN mkdir -p /input /output /tmp /data /app

WORKDIR /app

COPY worker/requirements.txt ./

RUN pip3.12 install -r requirements.txt

# COPY worker/package.json app/package-lock.json ./

# RUN npm install

COPY worker ./

CMD sleep infinity
# CMD node app.js 0