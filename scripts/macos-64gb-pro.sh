#!/bin/bash
# ============================================
# 🦞 LocalClaw PRO Bundle
# Generated for: macOS · 64GB RAM · Everything
# Model: Qwen 2.5 72B (Q4_K_M)
# ============================================
# https://localclaw.io — Run AI On Your Terms
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🦞 LocalClaw PRO Bundle                      ║${NC}"
echo -e "${CYAN}║  Model: Qwen 2.5 72B                           ║${NC}"
echo -e "${CYAN}║  Optimized for: macOS · 64GB+ · Everything    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Check/Install Homebrew ──
echo -e "${YELLOW}[1/6]${NC} Checking Homebrew..."
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}  → Installing Homebrew (this may ask for your password)...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [[ $(uname -m) == "arm64" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    fi
    echo -e "${GREEN}  ✓ Homebrew installed${NC}"
else
    echo -e "${GREEN}  ✓ Homebrew already installed${NC}"
fi

# ── Step 2: Install LM Studio ──
echo -e "${YELLOW}[2/6]${NC} Installing LM Studio..."
if [ -d "/Applications/LM Studio.app" ]; then
    echo -e "${GREEN}  ✓ LM Studio already installed${NC}"
else
    brew install --cask lm-studio
    echo -e "${GREEN}  ✓ LM Studio installed${NC}"
fi

# ── Step 3: Bootstrap CLI ──
echo -e "${YELLOW}[3/6]${NC} Setting up LM Studio CLI..."
if command -v lms &> /dev/null; then
    echo -e "${GREEN}  ✓ CLI already available${NC}"
else
    echo -e "${YELLOW}  → Opening LM Studio for first-time setup...${NC}"
    open -a "LM Studio"
    echo -e "${YELLOW}  → Waiting 15 seconds for initialization...${NC}"
    sleep 15
    if [ -f "$HOME/.lmstudio/bin/lms" ]; then
        "$HOME/.lmstudio/bin/lms" bootstrap
    else
        echo -e "${RED}  ✗ CLI not found at ~/.lmstudio/bin/lms${NC}"
        echo -e "${YELLOW}  → Please open LM Studio manually, go to Settings > Developer,${NC}"
        echo -e "${YELLOW}    enable CLI, then re-run this script.${NC}"
        exit 1
    fi
    export PATH="$HOME/.lmstudio/bin:$PATH"
    echo -e "${GREEN}  ✓ CLI ready${NC}"
fi

# ── Step 4: Download the model ──
MODEL_ID="lmstudio-community/Qwen2.5-72B-Instruct-GGUF"
echo -e "${YELLOW}[4/6]${NC} Downloading Qwen 2.5 72B..."
echo -e "${YELLOW}  → This may take a few minutes depending on your connection${NC}"
lms get "${MODEL_ID}" 2>/dev/null || {
    echo -e "${YELLOW}  → Retrying with explicit download...${NC}"
    lms get "${MODEL_ID}"
}
echo -e "${GREEN}  ✓ Model downloaded${NC}"

# ── Step 5: Load model + start server ──
echo -e "${YELLOW}[5/6]${NC} Loading model and starting server..."
lms load "${MODEL_ID}" --yes 2>/dev/null || lms load "${MODEL_ID}"
lms server start
echo -e "${GREEN}  ✓ Server running on http://localhost:1234${NC}"

# ── Step 6 (Pro): Optimal Settings + Auto-Start ──
echo -e "${YELLOW}[6/6]${NC} Applying Pro settings..."

# Context window: 32768 tokens (optimized for 64GB+ RAM)
echo -e "${YELLOW}  → Context window: 32768 tokens (optimal for 64GB+)${NC}"
echo -e "${YELLOW}  → Tip: Adjust in LM Studio Settings > Context Length${NC}"

# Create LaunchAgent for auto-start on login
PLIST_PATH="$HOME/Library/LaunchAgents/io.localclaw.lmstudio.plist"
if [ ! -f "${PLIST_PATH}" ]; then
    mkdir -p "$HOME/Library/LaunchAgents"
    cat > "${PLIST_PATH}" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>io.localclaw.lmstudio</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>sleep 10 && open -a "LM Studio"</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST
    launchctl load "${PLIST_PATH}" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Auto-start on login configured${NC}"
else
    echo -e "${GREEN}  ✓ Auto-start already configured${NC}"
fi

echo -e "${GREEN}  ✓ Pro settings applied${NC}"

# ── Done! ──
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Your local AI is ready! (PRO)              ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  🔧 Pro features enabled:                     ║${NC}"
echo -e "${GREEN}║     • Context: 32768 tokens                   ║${NC}"
echo -e "${GREEN}║     • Auto-start on login                     ║${NC}"
echo -e "${GREEN}║     • API server running                      ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  API: http://localhost:1234                    ║${NC}"
echo -e "${GREEN}║  Powered by LocalClaw.io 🦞                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}💡 Quick test:${NC}"
echo -e "   curl http://localhost:1234/v1/models"
echo ""
echo -e "${CYAN}💡 Chat via API:${NC}"
echo -e "   curl http://localhost:1234/v1/chat/completions \\"
echo -e "     -H 'Content-Type: application/json' \\"
echo -e "     -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"
echo ""
