# --- STAGE 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY dashboard/package*.json ./
RUN npm install
COPY dashboard/ .
RUN npm run build

# --- STAGE 2: Build Go Backend ---
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build binary
RUN go build -o aetherd ./cmd/aetherd/main.go

# --- STAGE 3: Final Runtime ---
FROM alpine:latest
WORKDIR /root/
# Copy binary from stage 2
COPY --from=backend-builder /app/aetherd .
# Copy React build output from stage 1 to dist folder
COPY --from=frontend-builder /app/dist ./dist

# Expose P2P, gRPC, and WebSocket/HTTP ports
EXPOSE 6001 50051 8080

# Run the node
CMD ["./aetherd", "start", "--port", "6001", "--data", "./data"]
