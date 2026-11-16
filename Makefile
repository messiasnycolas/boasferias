.PHONY: setup run check verify

setup: ## Node, dependencies, Playwright image, git hooks
	@scripts/setup.sh

run: ## Dev server with hot reload on http://localhost:4200
	docker compose up

check: ## Fast loop: format, lint, unit tests
	@scripts/verify.sh check

verify: ## The full deploy gate, as CI runs it
	@scripts/verify.sh verify
