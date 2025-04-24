FROM nvidia/cuda:12.8.1-cudnn-runtime-rockylinux9

RUN dnf -y update \
    # && dnf -y install 'dnf-command(config-manager)' \
    # epel-release \
    # && dnf config-manager --set-enabled crb \
    && dnf -y install \
    python3-devel \
    # gcc-c++ \
    # cmake \
    # openblas-devel \
    nodejs \
    && dnf clean all

RUN mkdir -p /input /output /tmp /data /app

WORKDIR /app

COPY worker/requirements.txt ./

RUN pip install -r requirements.txt

# COPY worker/package.json app/package-lock.json ./

# RUN npm install

COPY worker ./

CMD sleep infinity
# CMD node app.js 0