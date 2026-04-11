#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
#  ekkOS_ Installer — macOS / Linux
#  https://ekkos.dev
#
#  Usage:
#    curl -fsSL https://ekkos.dev/i | bash
#
#  View this script before running:
#    curl https://ekkos.dev/i | less
#
#  Source code:
#    https://github.com/Ekkos-Technologies-Inc/ekkos-open/blob/main/scripts/install/install.sh
#
#  Alternative install (no pipe-to-shell):
#    npm install -g @ekkos/cli && ekkos init
# ─────────────────────────────────────────────────────────────────────────────

BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
DIM="\033[2m"
DARKCYAN="\033[0;36m"
RESET="\033[0m"

TOTAL_STEPS=5

banner() {
  echo ""
  echo -e "${CYAN}${BOLD}  ┌──────────────────────────────────────┐${RESET}"
  echo -e "${CYAN}${BOLD}  │         ekkOS_ Installer             │${RESET}"
  echo -e "${CYAN}${BOLD}  │  The Intelligence Layer for AI Dev   │${RESET}"
  echo -e "${CYAN}${BOLD}  └──────────────────────────────────────┘${RESET}"
  echo ""
}

step() {
  local num=$1
  local msg=$2
  local pct=$(( (num - 1) * 100 / TOTAL_STEPS ))
  echo ""
  echo -e "${DARKCYAN}  ┌─ Step $num/$TOTAL_STEPS [$pct%] ─────────────────────────${RESET}"
  echo -e "  │ $msg"
  echo -e "${DARKCYAN}  └──────────────────────────────────────────${RESET}"
}

info()    { echo -e "  ${CYAN}→${RESET} $1"; }
success() { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()    { echo -e "  ${YELLOW}!${RESET} $1"; }
fail()    { echo -e "  ${RED}✗${RESET} $1"; exit 1; }

banner

# ── Step 1: Check for Node.js ──────────────────────────────────────────────────
step 1 "Checking Node.js..."

if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v)
  success "Node.js $NODE_VERSION found"
else
  warn "Node.js not found — installing..."

  OS=$(uname -s)

  if [ "$OS" = "Darwin" ]; then
    # macOS
    if command -v brew &>/dev/null; then
      info "Installing via Homebrew..."
      brew install node
    else
      info "Homebrew not found — installing Node.js from nodejs.org..."
      NODE_PKG_URL="https://nodejs.org/dist/v22.15.0/node-v22.15.0.pkg"
      TMPFILE=$(mktemp /tmp/node-installer.XXXXXX.pkg)
      curl -fsSL "$NODE_PKG_URL" -o "$TMPFILE"
      sudo installer -pkg "$TMPFILE" -target /
      rm -f "$TMPFILE"
    fi
  elif [ "$OS" = "Linux" ]; then
    if command -v apt-get &>/dev/null; then
      info "Installing via apt..."
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif command -v dnf &>/dev/null; then
      info "Installing via dnf..."
      curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo -E bash -
      sudo dnf install -y nodejs
    elif command -v yum &>/dev/null; then
      info "Installing via yum..."
      curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo -E bash -
      sudo yum install -y nodejs
    elif command -v pacman &>/dev/null; then
      info "Installing via pacman..."
      sudo pacman -Sy --noconfirm nodejs npm
    else
      fail "Could not detect package manager. Install Node.js manually from https://nodejs.org"
    fi
  else
    fail "Unsupported OS: $OS. Install Node.js manually from https://nodejs.org"
  fi

  if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js $NODE_VERSION installed"
  else
    fail "Node.js installation failed. Install manually from https://nodejs.org"
  fi
fi

# ── Step 2: Check npm ──────────────────────────────────────────────────────────
step 2 "Checking npm..."

if ! command -v npm &>/dev/null; then
  fail "npm not found. Reinstall Node.js from https://nodejs.org"
fi

NPM_VERSION=$(npm -v)
success "npm v$NPM_VERSION found"

# ── Step 3: Install ekkOS CLI ──────────────────────────────────────────────────
step 3 "Installing @ekkos/cli..."

npm install -g @ekkos/cli@latest 2>&1 | while IFS= read -r line; do
  echo -e "  ${DIM}$line${RESET}"
done

# Find the CLI entry point
NPM_PREFIX=$(npm prefix -g)
CLI_ENTRY="$NPM_PREFIX/lib/node_modules/@ekkos/cli/dist/index.js"

if [ ! -f "$CLI_ENTRY" ]; then
  # Try alternate location (some npm setups)
  CLI_ENTRY="$NPM_PREFIX/node_modules/@ekkos/cli/dist/index.js"
fi

if [ -f "$CLI_ENTRY" ]; then
  EKKOS_VERSION=$(node "$CLI_ENTRY" --version 2>/dev/null || echo "installed")
  success "ekkOS CLI $EKKOS_VERSION installed"
else
  fail "ekkOS CLI installation failed. Try: sudo npm install -g @ekkos/cli@latest"
fi

# ── Step 4: Configure shell ────────────────────────────────────────────────────
step 4 "Configuring shell..."

# Determine shell profile
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ] || [ "$SHELL" = "/usr/bin/zsh" ]; then
  SHELL_PROFILE="$HOME/.zshrc"
  SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ] || [ "$SHELL" = "/usr/bin/bash" ]; then
  if [ -f "$HOME/.bash_profile" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
  else
    SHELL_PROFILE="$HOME/.bashrc"
  fi
  SHELL_NAME="bash"
else
  SHELL_PROFILE="$HOME/.profile"
  SHELL_NAME="sh"
fi

# Add ekkos functions to shell profile (fallback if PATH doesn't work)
EKKOS_BLOCK="
# === ekkOS CLI ===
ekkos() { node \"$CLI_ENTRY\" \"\$@\"; }
ekkos-mcp() { node \"${CLI_ENTRY%index.js}mcp/index.js\" \"\$@\"; }
export -f ekkos ekkos-mcp 2>/dev/null || true
# ================="

if [ -f "$SHELL_PROFILE" ]; then
  if ! grep -q "ekkOS CLI" "$SHELL_PROFILE" 2>/dev/null; then
    echo "$EKKOS_BLOCK" >> "$SHELL_PROFILE"
    success "Added ekkos to $SHELL_PROFILE"
  else
    success "ekkos already in $SHELL_PROFILE"
  fi
else
  echo "$EKKOS_BLOCK" > "$SHELL_PROFILE"
  success "Created $SHELL_PROFILE with ekkos"
fi

# Make available in current session
eval "$EKKOS_BLOCK"
success "Commands available in this session"

# ── Step 5: Run ekkos init ─────────────────────────────────────────────────────
step 5 "Running setup..."

echo ""
echo -e "${GREEN}${BOLD}  ┌──────────────────────────────────────┐${RESET}"
echo -e "${GREEN}${BOLD}  │  ████████████████████████████ 100%   │${RESET}"
echo -e "${GREEN}${BOLD}  │       Installation complete!         │${RESET}"
echo -e "${GREEN}${BOLD}  └──────────────────────────────────────┘${RESET}"
echo ""

info "Running ekkos init..."
echo ""

node "$CLI_ENTRY" init

echo ""
echo -e "${GREEN}${BOLD}  ┌──────────────────────────────────────────────┐${RESET}"
echo -e "${GREEN}${BOLD}  │           ✓ Setup complete!                  │${RESET}"
echo -e "${GREEN}${BOLD}  └──────────────────────────────────────────────┘${RESET}"
echo ""
echo -e "  ekkos command is ready! Just type:"
echo ""
echo -e "    ${CYAN}ekkos${RESET}"
echo ""
echo -e "  ${DIM}Docs:  https://docs.ekkos.dev${RESET}"
echo -e "  ${DIM}Help:  ekkos --help${RESET}"
echo ""
