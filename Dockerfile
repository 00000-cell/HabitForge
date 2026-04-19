# Stage 1: Build React Frontend
FROM node:20 AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build C++ Backend
FROM ubuntu:24.04 AS backend-builder
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y cmake g++ git make libasio-dev
WORKDIR /app
COPY backend /app/backend
WORKDIR /app/build
# We use standard Unix Makefiles here because this stage runs on Linux
RUN cmake ../backend -G "Unix Makefiles"
RUN cmake --build . -j4

# Stage 3: Final Runtime Image
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# Install runtime dependencies if any (Crow/Asio are header-only statically compiled mostly, but libstdc++ is needed)
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

# Copy the compiled C++ executable
COPY --from=backend-builder /app/build/server /app/server

# Copy the built React static files to the expected dist/ directory
COPY --from=frontend-builder /app/dist /app/dist

# Ensure the server executable has running permissions
RUN chmod +x /app/server

# Run the server
CMD ["/app/server"]
