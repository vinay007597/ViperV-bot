FROM ubuntu:22.04

# Install compiler and node
RUN apt-get update && apt-get install -y g++ nodejs npm

# Copy and compile your binary
COPY v.cpp /tmp/
RUN g++ -o /app/v /tmp/v.cpp -static

# Copy bot files
COPY bot.js /app/
COPY package.json /app/

# Setup node
WORKDIR /app
RUN npm install

# Run bot
CMD ["node", "bot.js"]
