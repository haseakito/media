# Start the docker container and orchestrate containers
start:
	@echo "Starting docker container..."
	docker compose up

# Stop the docker container
stop:
	@echo "Shutting down docker container..."
	docker compose down