# Use an official Node.js runtime as the base image
FROM node:20-alpine AS base

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if exists) to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app for production
RUN npm run build

# Expose the port the app will run on (Render will override this with PORT env var)
EXPOSE 3000

# Start the app in production mode
CMD ["npm", "start"]
