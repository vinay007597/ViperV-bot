FROM ubuntu:22.04

# Install everything
RUN apt-get update && apt-get install -y g++ nodejs npm

# Create app directory
WORKDIR /app

# Copy source code
COPY v.cpp /app/
COPY bot.js /app/
COPY package.json /app/

# Compile the binary
RUN g++ -o /app/v /app/v.cpp -static

# Install Node dependencies
RUN npm install

# Make sure binary exists and is executable
RUN chmod +x /app/v && ls -la /app/v

# Run bot
CMD ["node", "bot.js"]
