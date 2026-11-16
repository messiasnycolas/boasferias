# Shared by the scripts: puts the Node version from apps/web/.nvmrc on PATH when nvm is available.
WEB="$(cd "$(dirname "${BASH_SOURCE[0]}")/../apps/web" && pwd)"

use_node() {
  local want
  want="v$(cat "$WEB/.nvmrc")"
  [ "$(node -v 2>/dev/null)" = "$want" ] && return 0
  for f in "${NVM_DIR:-$HOME/.nvm}/nvm.sh" /home/linuxbrew/.linuxbrew/opt/nvm/nvm.sh /opt/homebrew/opt/nvm/nvm.sh; do
    # shellcheck disable=SC1090
    [ -s "$f" ] && . "$f" && break
  done
  command -v nvm >/dev/null || { echo "Node $want not found; install nvm or Node $want." >&2; return 1; }
  nvm use --silent "$want" >/dev/null 2>&1 || nvm install "$want" >/dev/null
}

# The Playwright image matching the installed @playwright/test, so local browser runs equal CI.
playwright_image() {
  [ -f "$WEB/node_modules/@playwright/test/package.json" ] || { echo "Run make setup first." >&2; return 1; }
  echo "mcr.microsoft.com/playwright:v$(node -p "require('$WEB/node_modules/@playwright/test/package.json').version")-noble"
}
