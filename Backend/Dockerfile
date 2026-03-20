FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY Backend . 

# Copy frontend static files
COPY frontend ./static

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]