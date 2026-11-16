#!/usr/bin/env bash
# One-time local setup: Node from .nvmrc, dependencies, the Playwright image, and the git hooks.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
use_node
cd "$WEB"
npm ci --no-audit --no-fund
docker pull --quiet "$(playwright_image)"
git config core.hooksPath .githooks
echo "Ready: make run (dev server), make check (fast), make verify (full gate, also runs before push)."
