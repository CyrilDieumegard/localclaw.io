#!/bin/bash
# ============================================
# 🦞 LocalClaw One-Click Setup
# Generated for: macOS · 32GB RAM · Everything
# Model: DeepSeek R1 32B (Q4_K_M)
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
echo -e "${CYAN}║  🦞 LocalClaw One-Click Setup                 ║${NC}"
echo -e "${CYAN}║  Model: DeepSeek R1 32B                       ║${NC}"
echo -e "${CYAN}║  Optimized for: macOS · 32GB · Everything     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Check/Install Homebrew ──
echo -e "${YELLOW}[1/5]${NC} Checking Homebrew..."
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
echo -e "${YELLOW}[2/5]${NC} Installing LM Studio..."
if [ -d "/Applications/LM Studio.app" ]; then
    echo -e "${GREEN}  ✓ LM Studio already installed${NC}"
else
    brew install --cask lm-studio
    echo -e "${GREEN}  ✓ LM Studio installed${NC}"
fi

# ── Step 3: Bootstrap CLI ──
echo -e "${YELLOW}[3/5]${NC} Setting up LM Studio CLI..."
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
MODEL_ID="lmstudio-community/DeepSeek-R1-Distill-Qwen-32B-GGUF"
echo -e "${YELLOW}[4/5]${NC} Downloading DeepSeek R1 32B..."
echo -e "${YELLOW}  → This may take a few minutes depending on your connection${NC}"
lms get "${MODEL_ID}" 2>/dev/null || {
    echo -e "${YELLOW}  → Retrying with explicit download...${NC}"
    lms get "${MODEL_ID}"
}
echo -e "${GREEN}  ✓ Model downloaded${NC}"

# ── Step 5: Load model + start server ──
echo -e "${YELLOW}[5/5]${NC} Loading model and starting server..."
lms load "${MODEL_ID}" --yes 2>/dev/null || lms load "${MODEL_ID}"
lms server start
echo -e "${GREEN}  ✓ Server running on http://localhost:1234${NC}"

# ── Done! ──
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Your local AI is ready!                    ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  Open LM Studio and start chatting,            ║${NC}"
echo -e "${GREEN}║  or use the API at http://localhost:1234       ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  Powered by LocalClaw.io 🦞                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}💡 Quick test:${NC}"
echo -e "   curl http://localhost:1234/v1/models"
echo ""
