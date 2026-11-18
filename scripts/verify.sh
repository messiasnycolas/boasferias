#!/usr/bin/env bash
# The deploy gate, one line per step. Each step's output goes to apps/web/tmp/verify/<step>.log;
# a failing step prints the tail of its log. Locally, browser steps run in Playwright's image.
# Usage: scripts/verify.sh check|verify   (check: format, lint, unit; verify: the full CI gate)
set -uo pipefail
. "$(dirname "$0")/lib.sh"
use_node || exit 1
cd "$WEB"
mkdir -p tmp/verify
rm -f tmp/verify/*.log

failed=()
started=$SECONDS

step() {
  local name=$1 start=$SECONDS
  shift
  if "$@" >"tmp/verify/$name.log" 2>&1; then
    printf '✓ %-11s %4ss\n' "$name" $((SECONDS - start))
  else
    printf '✗ %-11s %4ss   → apps/web/tmp/verify/%s.log\n' "$name" $((SECONDS - start)) "$name"
    tail -n 25 "tmp/verify/$name.log" | sed 's/^/    /'
    failed+=("$name")
    return 1
  fi
}

skip() { printf -- '- %-11s skipped (%s failed)\n' "$1" "$2"; failed+=("$1"); }

# Locally the browser runs in Docker (WSL lacks Chrome's libraries); CI installs it natively.
browser() {
  if [ -n "${CI:-}" ]; then
    "$@"
  else
    mkdir -p "$HOME/.npm" # else Docker creates it as root
    docker run --rm --ipc=host --network=host --user "$(id -u):$(id -g)" -e HOME=/tmp \
      -e npm_config_cache=/npm-cache -v "$HOME/.npm:/npm-cache" -v "$WEB:/work" -w /work "$(playwright_image)" "$@"
  fi
}

lighthouse() {
  if [ -n "${CI:-}" ]; then
    npx -y @lhci/cli@0.16.1 autorun
  else
    browser sh -c 'CHROME_PATH=$(ls /ms-playwright/chromium-*/chrome-linux*/chrome | head -n 1) \
      npx -y @lhci/cli@0.16.1 autorun --collect.settings.chromeFlags="--no-sandbox"'
  fi
}

step format npm run format:check
step lint npm run lint
step unit npm test -- --watch=false

if [ "${1:-verify}" = verify ]; then
  # Production dependencies only: the site ships static files, dev tools never reach users.
  step audit npm audit --omit=dev --audit-level=high
  if step build npm run build; then
    step e2e browser npx playwright test
    step lighthouse lighthouse
  else
    skip e2e build
    skip lighthouse build
  fi
fi

total=$((SECONDS - started))
if [ ${#failed[@]} -eq 0 ]; then
  echo "PASS in ${total}s"
else
  echo "FAIL (${failed[*]}) in ${total}s"
  exit 1
fi
