FROM python:alpine3.20

WORKDIR /app

COPY requirements.txt .

RUN python --version
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python" , "/app/main.py"]