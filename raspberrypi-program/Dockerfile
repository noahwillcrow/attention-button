FROM arm32v6/python:3.8-alpine

WORKDIR /usr/src/app

COPY ./requirements.txt ./
COPY ./**.py ./

RUN pip3 install -r requirements.txt

ENTRYPOINT [ "python3", "main.py" ]