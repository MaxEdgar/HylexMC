#!/bin/bash

# ================= COLORS =================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ================= LOG HELPERS =================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

section() {
  echo -e "\n${MAGENTA}========== $1 ==========${NC}\n"
}

# ================= SPINNER =================

spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'

  while kill -0 $pid 2>/dev/null; do
    for i in $(seq 0 3); do
      printf "\r${CYAN}[UPDATING]${NC} %s" "${spinstr:$i:1}"
      sleep $delay
    done
  done

  printf "\r"
}

# ================= PROGRESS BAR =================

progress_bar() {
  local duration=$1
  local width=40

  for ((i=0; i<=duration; i++)); do
    percent=$((i * 100 / duration))
    filled=$((i * width / duration))

    bar=$(printf "%-${width}s" "#" | sed "s/ /#/g" | cut -c1-$filled)
    empty=$(printf "%-$((width - filled))s")

    printf "\r${CYAN}[%-${width}s] %d%%${NC}" "${bar}${empty}" "${percent}"
    sleep 0.05
  done
  echo ""
}

# ================= UPDATE PROCESS =================

section "HYLEX AUTO UPDATER"

log_info "Starting update process..."
sleep 1

PROJECT_DIR=$(pwd)

log_info "Current directory: $PROJECT_DIR"

# ================= REMOVE OLD FILE =================

section "CLEANING OLD FILES"

if [ -f "XP.js" ]; then
  log_warn "Old XP.js found. Removing..."
  rm -f XP.js
  log_success "Old XP.js removed."
else
  log_warn "No existing XP.js found. Skipping removal."
fi

sleep 1

# ================= DOWNLOAD NEW FILE =================

section "DOWNLOADING LATEST XP.js"

URL="https://raw.githubusercontent.com/yourname/yourrepo/main/XP.js"

log_info "Fetching latest XP.js from GitHub..."

(
  curl -L -o XP.js "$URL"
) &

spinner $!

if [ $? -ne 0 ] || [ ! -f XP.js ]; then
  log_error "Download failed!"
  exit 1
fi

log_success "XP.js downloaded successfully."

# Fake progress animation for UX feel
progress_bar 60

# ================= PERMISSIONS =================

section "SETTING PERMISSIONS"

chmod +x XP.js
log_success "Executable permissions set."

sleep 1

# ================= FINAL =================

section "FINALIZING"

log_info "Verifying file..."

if [ -s XP.js ]; then
  log_success "File integrity check passed."
else
  log_error "File is empty or corrupted!"
  exit 1
fi

sleep 1

section "RESTARTING BOT"

log_success "Update complete!"
log_info "Restarting XP.js..."

sleep 2

node XP.js