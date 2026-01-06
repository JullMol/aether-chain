.PHONY: build run test clean docker-build docker-up docker-down proto-gen bench

# Build the aetherd binary
build:
	go build -o aetherd ./cmd/aetherd/main.go

# Run the node
run: build
	./aetherd start --port 6001 --data ./data

# Run tests
test:
	go test ./...

# Run benchmark
bench: build
	./aetherd bench

# Clean build artifacts
clean:
	rm -f aetherd
	rm -rf data/

# Build Docker image
docker-build:
	docker build -t aether-chain .

# Start multi-node cluster
docker-up:
	docker-compose up --build -d

# Stop cluster
docker-down:
	docker-compose down

# Generate protobuf files
proto-gen:
	protoc --go_out=. --go-grpc_out=. proto/aether.proto

# Build dashboard
dashboard-build:
	cd dashboard && npm install && npm run build

# Run dashboard dev server
dashboard-dev:
	cd dashboard && npm run dev
