.PHONY: help install dev build start stop restart logs db-migrate db-studio db-seed clean

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Show this help message
	@echo 'Nova Template - Available commands:'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ''

# API directory
API_DIR := app/api

# Dashboard directory
DASHBOARD_DIR := app/dashboard

install: install-api install-dashboard ## Install all dependencies

install-api: ## Install API dependencies
	cd $(API_DIR) && npm install

install-dashboard: ## Install Dashboard dependencies
	cd $(DASHBOARD_DIR) && npm install

dev: dev-api dev-dashboard ## Start development servers

dev-api: ## Start API development server
	cd $(API_DIR) && npm run dev

dev-dashboard: ## Start Dashboard development server
	cd $(DASHBOARD_DIR) && npm run dev

build: build-api build-dashboard ## Build for production

build-api: ## Build API
	cd $(API_DIR) && npm run build

build-dashboard: ## Build Dashboard
	cd $(DASHBOARD_DIR) && npm run build

start: ## Start production servers with Docker Compose
	docker compose up -d

stop: ## Stop production servers
	docker compose down

restart: stop start ## Restart production servers

logs: ## View logs
	docker compose logs -f

logs-api: ## View API logs
	docker compose logs -f api

logs-dashboard: ## View Dashboard logs
	docker compose logs -f dashboard

db-migrate: ## Run database migrations
	cd $(API_DIR) && npx prisma migrate deploy

db-studio: ## Open Prisma Studio
	cd $(API_DIR) && npx prisma studio

db-seed: ## Seed the database
	cd $(API_DIR) && npx prisma db seed

clean: clean-api clean-dashboard ## Clean build artifacts

clean-api: ## Clean API build artifacts
	cd $(API_DIR) && rm -rf dist node_modules

clean-dashboard: ## Clean Dashboard build artifacts
	cd $(DASHBOARD_DIR) && rm -rf dist node_modules

# Docker commands
docker-build: ## Build Docker images
	docker compose build

docker-pull: ## Pull Docker images
	docker compose pull

docker-ps: ## List running containers
	docker compose ps

# Dev Docker Compose
dev-up: ## Start development with Docker Compose
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

dev-down: ## Stop development containers
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
