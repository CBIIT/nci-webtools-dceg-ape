FROM nvidia/cuda:12.9.0-cudnn-runtime-rockylinux9

RUN dnf -y update \
    && dnf -y install \
    gcc-c++ \
    mesa-libGL \
    python3-devel \
    python3-pip \
    nodejs \
<<<<<<< HEAD
    libcusparselt0 \
    libcusparselt-devel \
=======
    libcusparselt0 \ 
    libcusparselt-devel \
    cuda-toolkit-12-9 \
>>>>>>> ape_1.0.0_dev
    && dnf clean all

RUN mkdir -p /input /output /tmp /data /app

WORKDIR /app

COPY worker/requirements.txt ./

RUN pip3 install -r requirements.txt

COPY worker/package.json worker/package-lock.json ./

RUN npm install

COPY worker ./

CMD node app.js 0