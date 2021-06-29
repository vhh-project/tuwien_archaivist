FROM python:3.9-slim-buster
WORKDIR /code
COPY . .
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5001
RUN apt-get update && apt-get install -y \
curl poppler-utils
RUN pip install --upgrade pip
RUN pip install pipenv
RUN pipenv install
EXPOSE 5001
CMD ["pipenv", "run", "flask", "run"]
