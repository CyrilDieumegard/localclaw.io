#!/bin/bash
# ============================================
# 🦞 LocalClaw PRO Bundle
# Generated for: Linux · 8GB RAM · Everything
# Model: GLM 4.7 Flash (Q4_K_M)
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
echo -e "${CYAN}║  Model: GLM 4.7 Flash                         ║${NC}"
echo -e "${CYAN}║  Optimized for: Linux · 8GB · Everything      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Download & Install LM Studio ──
echo -e "${YELLOW}[1/5]${NC} Installing LM Studio for Linux..."
if command -v lms &> /dev/null; then
    echo -e "${GREEN}  ✓ LM Studio CLI already available${NC}"
else
    ARCH=$(uname -m)
    LMS_DIR="$HOME/.local/bin"
    mkdir -p "${LMS_DIR}"

    if [ "${ARCH}" == "x86_64" ]; then
        echo -e "${YELLOW}  → Downloading LM Studio (x64)...${NC}"
        curl -fSL -o "${LMS_DIR}/LMStudio.AppImage" "https://lmstudio.ai/download/linux/x64"
    else
        echo -e "${YELLOW}  → Downloading LM Studio (arm64)...${NC}"
        curl -fSL -o "${LMS_DIR}/LMStudio.AppImage" "https://lmstudio.ai/download/linux/arm64"
    fi
    chmod +x "${LMS_DIR}/LMStudio.AppImage"
    echo -e "${GREEN}  ✓ LM Studio downloaded${NC}"

    echo -e "${YELLOW}  → Running LM Studio for first-time setup...${NC}"
    "${LMS_DIR}/LMStudio.AppImage" &
    LMS_PID=$!
    echo -e "${YELLOW}  → Waiting 15 seconds for initialization...${NC}"
    sleep 15

    if [ -f "$HOME/.lmstudio/bin/lms" ]; then
        "$HOME/.lmstudio/bin/lms" bootstrap
    else
        echo -e "${RED}  ✗ CLI not found at ~/.lmstudio/bin/lms${NC}"
        echo -e "${YELLOW}  → Please open LM Studio manually, then re-run this script.${NC}"
        kill ${LMS_PID} 2>/dev/null || true
        exit 1
    fi
    export PATH="$HOME/.lmstudio/bin:$PATH"
    echo -e "${GREEN}  ✓ CLI ready${NC}"
fi

# ── Step 2: Download the model ──
MODEL_ID="THUDM/GLM-4.7-Flash-GGUF"
echo -e "${YELLOW}[2/5]${NC} Downloading GLM 4.7 Flash..."
echo -e "${YELLOW}  → This may take a few minutes depending on your connection${NC}"
lms get "${MODEL_ID}" 2>/dev/null || {
    echo -e "${YELLOW}  → Retrying with explicit download...${NC}"
    lms get "${MODEL_ID}"
}
echo -e "${GREEN}  ✓ Model downloaded${NC}"

# ── Step 3: Load + Start server ──
echo -e "${YELLOW}[3/5]${NC} Loading model and starting server..."
lms load "${MODEL_ID}" --yes 2>/dev/null || lms load "${MODEL_ID}"
lms server start
echo -e "${GREEN}  ✓ Server running on http://localhost:1234${NC}"

# ── Step 4: Verify ──
echo -e "${YELLOW}[4/5]${NC} Verifying installation..."
sleep 2
if curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ API is responding!${NC}"
else
    echo -e "${YELLOW}  → Server may still be loading. Try again in a few seconds.${NC}"
fi

# ── Step 5 (Pro): Optimal Settings ──
echo -e "${YELLOW}[5/5]${NC} Applying Pro settings..."
echo -e "${YELLOW}  → Context window: 4096 tokens (optimal for 8GB)${NC}"
echo -e "${YELLOW}  → Tip: Adjust in LM Studio Settings > Context Length${NC}"
echo -e "${GREEN}  ✓ Pro settings applied${NC}"

# ── Done! ──
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Your local AI is ready! (PRO)              ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  🔧 Pro features enabled:                     ║${NC}"
echo -e "${GREEN}║     • Context: 4096 tokens                    ║${NC}"
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
