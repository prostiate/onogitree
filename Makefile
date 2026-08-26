# OnoGitTree Makefile
# High-Performance Multi-Repository Git GUI

GOPATH ?= $(shell go env GOPATH 2>/dev/null || echo $(HOME)/go)
PNPM ?= $(shell which pnpm 2>/dev/null || echo $(HOME)/.local/share/pnpm/bin/pnpm)
WAILS ?= $(shell which wails 2>/dev/null || echo $(GOPATH)/bin/wails)
WAILS_TAGS ?= webkit2_41

export PATH := $(PATH):$(GOPATH)/bin:$(HOME)/go/bin:$(HOME)/.local/share/pnpm/bin:$(HOME)/.bun/bin:/snap/bin:/usr/local/bin

.PHONY: all dev build test test-backend test-frontend check lint clean help setup-ubuntu

all: build

help:
	@echo "OnoGitTree Build & Development Commands:"
	@echo "  make dev             - Start live development server with Hot Module Reloading (HMR)"
	@echo "  make build           - Build production desktop binary (build/bin/onogitree)"
	@echo "  make test            - Run all backend (Go) and frontend (Vitest) unit tests"
	@echo "  make check           - Run TypeScript strict type-check and Go vet"
	@echo "  make clean           - Remove build artifacts and temporary binaries"
	@echo "  make setup-ubuntu    - Show required Ubuntu system packages command"

setup-ubuntu:
	@echo "Run the following command to install required Linux GTK/WebKit dev headers:"
	@echo "sudo apt-get update && sudo apt-get install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev"

dev:
	@echo "🚀 Starting OnoGitTree in development mode..."
	$(WAILS) dev -tags "$(WAILS_TAGS)"

build:
	@echo "📦 Building production frontend and desktop binary..."
	cd frontend && $(PNPM) build
	$(WAILS) build -tags "$(WAILS_TAGS)"

test: test-backend test-frontend
	@echo "✅ All tests passed successfully!"

test-backend:
	@echo "🧪 Running Go backend unit tests with race detection..."
	go test -v -race ./...

test-frontend:
	@echo "🧪 Running SolidJS frontend unit tests with Vitest..."
	cd frontend && $(PNPM) test

check:
	@echo "🔍 Running strict TypeScript check..."
	cd frontend && $(PNPM) check
	@echo "🔍 Running Go vet..."
	go vet ./...

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf build/bin/
	rm -rf frontend/dist/
