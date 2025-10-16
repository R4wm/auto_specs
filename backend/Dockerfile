FROM python:3.11-slim

WORKDIR /app

# Install PostgreSQL client for pg_isready
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Copy everything else
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["/start.sh"]
