# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Install OpenSSL
RUN apk add --no-cache openssl

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the Docker container
COPY package*.json ./

# Install the application dependencies inside the Docker container
RUN npm install

# Copy the rest of the application into the Docker container
COPY . .

# Create necessary directories
RUN mkdir -p logs prisma/database

# Generate the Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port 3000 for the application
EXPOSE 3000

# Define the command to run the application
CMD [ "npm", "start" ]