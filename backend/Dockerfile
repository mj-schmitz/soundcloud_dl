FROM python:3.11-slim

# Install ffmpeg for audio processing and dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create downloads directory
RUN mkdir -p /tmp/soundcloud_downloads

# Expose port (Railway will set this dynamically)
EXPOSE $PORT

# Run the application with gunicorn for production
# Use shell form to allow environment variable expansion
CMD gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 300 --access-logfile - --error-logfile - app:app
