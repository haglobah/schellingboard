.PHONY: help dev build start lint typecheck lint-watch test test-unit test-integration test-watch test-coverage test-e2e test-e2e-headed format format-check precommit dev-migrate-up dev-migrate-status dev-migrate-create dev-db-seed dev-admin install install-playwright clean clean-all docker-build check-and-format dev-db-reset test-e2e-ci

SHELL := /usr/bin/env bash

help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start development server"
	@echo "  make dev-admin        Run admin CLI"
	@echo "  make precommit        Format, lint, typecheck, and run all tests (incl. e2e)"
	@echo ""
	@echo "Building:"
	@echo "  make build            Build for production"
	@echo "  make start            Start production server"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all unit and integration tests"
	@echo "  make test-unit        Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo "  make test-e2e         Run E2E tests (headless)"
	@echo "  make test-e2e-headed  Run E2E tests (headed, for local dev)"
	@echo "  make test-watch       Run unit and integration tests in watch mode"
	@echo "  make test-coverage    Run unit and integration tests with coverage"
	@echo ""
	@echo "Linting & Formatting:"
	@echo "  make lint             Run linter"
	@echo "  make lint-watch       Run linter in watch mode"
	@echo "  make typecheck        Run TypeScript type checking"
	@echo "  make format           Format code"
	@echo "  make format-check     Check code formatting"
	@echo ""
	@echo "Database:"
	@echo "  make dev-migrate-up   Run migrations"
	@echo "  make dev-migrate-status Check migration status"
	@echo "  make dev-migrate-create Generate new migration"
	@echo "  make dev-db-seed      Reset dev database and seed dummy data"
	@echo ""
	@echo "Dependencies:"
	@echo "  make install          Install dependencies"
	@echo "  make install-playwright Install Playwright browsers"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     Build Docker image (tags with git describe output)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove dev and build artifacts as well as test output"
	@echo "  make clean-all        Clean + remove node_modules"

install:
	bun install --frozen-lockfile

install-playwright: install
	bun x playwright install

dev: dev-migrate-up install
	bun set-env.ts dev bun x next dev

build: install
	bun x next build

start: install
	bun set-env.ts production bun x next start

lint: install
	bun x eslint --max-warnings 0 .

typecheck: install
	rm -rf .next/dev/types
	bun x next typegen
	bun x tsc --noEmit

lint-watch: install
	watchexec -c -w app -w db -w utils -w tests "bun x eslint --fix ."

test: install
	bun x vitest run

test-unit: install
	bun x vitest run tests/unit

test-integration: install
	bun x vitest run tests/integration

test-watch: install
	bun x vitest

test-coverage: install
	bun x vitest run --coverage

test-e2e: install-playwright
	bun set-env.ts test bun x playwright test

test-e2e-headed: install-playwright
	bun set-env.ts test bun x playwright test --headed

format: install
	bun x prettier --write .

format-check: install
	bun x prettier --check .

precommit: format lint typecheck test test-e2e

clean:
	rm -rf .next
	rm -f next-env.d.ts
	rm -f data.db data.test.db
	rm -rf playwright-report test-results
	rm -f tsconfig.tsbuildinfo

clean-all: clean
	rm -rf node_modules

dev-migrate-up: install
	bun set-env.ts dev bun x tsx scripts/migrate.ts

dev-migrate-status: install
	bun set-env.ts dev bun x drizzle-kit check

dev-migrate-create: install
	bun set-env.ts dev bun x drizzle-kit generate

dev-db-seed: install
	bun set-env.ts dev bun x tsx tests/e2e/reset-database.ts

dev-admin: install
	bun set-env.ts dev bun x tsx scripts/admin.ts

docker-build:
	APP_VERSION=$$(git describe --tags --always --dirty) docker compose build

# Deprecated aliases (hidden from help) — remove after a deprecation period.
# They print a warning pointing to the new name, then run it.
check-and-format:
	@echo "⚠️  'make check-and-format' is deprecated; use 'make precommit'" >&2
	@$(MAKE) precommit

dev-db-reset:
	@echo "⚠️  'make dev-db-reset' is deprecated; use 'make dev-db-seed'" >&2
	@$(MAKE) dev-db-seed

test-e2e-ci:
	@echo "⚠️  'make test-e2e-ci' is deprecated; use 'make test-e2e'" >&2
	@$(MAKE) test-e2e
