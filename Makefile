.PHONY: help setup install dev build start test lint format typecheck clean docker-up docker-down docker-reset db-generate db-migrate db-studio

help:
	@echo "Available commands:"
	@echo "  make setup        - Install dependencies and setup environment"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linter"
	@echo "  make format       - Format code"
	@echo "  make typecheck    - Run TypeScript type checking"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker services (PostgreSQL, pgAdmin)"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make docker-reset - Reset Docker volumes"
	@echo "  make db-generate  - Generate database migrations"
	@echo "  make db-migrate   - Apply database migrations"
	@echo "  make db-studio    - Open Drizzle Studio"

setup: install
	@echo "Creating .env file..."
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "Setup complete! Run 'make docker-up' then 'make dev' to start."

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

test:
	npm run test

lint:
	npm run lint

format:
	npm run format

typecheck:
	npm run typecheck

clean:
	rm -rf .next dist build coverage node_modules

docker-up:
	docker-compose up -d
	@echo "PostgreSQL started on localhost:5432"
	@echo "pgAdmin available at http://localhost:5050"

docker-down:
	docker-compose down

docker-reset:
	docker-compose down -v

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

all: clean install lint typecheck test build
	@echo "All tasks completed successfully!"
