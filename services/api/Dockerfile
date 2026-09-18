FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml .
COPY culture_context ./culture_context
RUN pip install --no-cache-dir .
EXPOSE 8580
CMD ["uvicorn","culture_context.api:app","--host","0.0.0.0","--port","8580"]
