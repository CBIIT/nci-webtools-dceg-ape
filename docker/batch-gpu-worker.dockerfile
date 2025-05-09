FROM nvidia/cuda:12.6.3-cudnn-runtime-rockylinux9

RUN dnf -y update \
    && dnf -y install \
    gcc-c++ \
    mesa-libGL \
    python3.12-devel \
    python3.12-pip \
    nodejs \
    libcusparselt0 \ 
    libcusparselt-devel \
    cuda-toolkit-12-6 \
    && dnf clean all

RUN mkdir -p /input /output /tmp /data /app

WORKDIR /app

COPY worker/requirements.txt ./

RUN pip3.12 install -r requirements.txt

COPY worker/package.json worker/package-lock.json ./

RUN npm install

COPY worker ./

CMD node app.js 0