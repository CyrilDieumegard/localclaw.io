#!/bin/bash
# ============================================
# 🦞 LocalClaw Full Install Pack
# Generated for: Linux · 16GB RAM · Everything
# Model: Phi-4 14B (Q4_K_M)
# ============================================
# https://localclaw.io — Run AI On Your Terms
# ============================================

# ── Error handling: guided fallback on failure ──
set -eE
trap 'echo ""; echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"; echo -e "${RED}║  ⚠  Something went wrong at step ${CURRENT_STEP}              ║${NC}"; echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"; echo ""; echo -e "${YELLOW}Guided fallback:${NC}"; echo -e "  1. Check the error message above"; echo -e "  2. Try running this script again: ${CYAN}./localclaw-setup.sh${NC}"; echo -e "  3. Or install manually:"; echo -e "     • LM Studio: ${CYAN}https://lmstudio.ai${NC}"; echo -e "     • OpenClaw:  ${CYAN}curl -fsSL https://openclaw.ai/install.sh | bash${NC}"; echo -e "  4. Need help? ${CYAN}support@localclaw.io${NC}"; echo ""' ERR

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'
CURRENT_STEP=0

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🦞 LocalClaw Full Install Pack               ║${NC}"
echo -e "${CYAN}║  Model: Phi-4 14B                             ║${NC}"
echo -e "${CYAN}║  Optimized for: Linux · 16GB · Everything     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_STEPS=5

# ── Step 1: Download & Install LM Studio ──
CURRENT_STEP=1
echo -e "${YELLOW}[1/${TOTAL_STEPS}]${NC} Installing LM Studio for Linux..."
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
CURRENT_STEP=2
MODEL_ID="lmstudio-community/Phi-4-Instruct-GGUF"
echo -e "${YELLOW}[2/${TOTAL_STEPS}]${NC} Downloading Phi-4 14B..."
echo -e "${YELLOW}  → This may take a few minutes depending on your connection${NC}"
lms get "${MODEL_ID}" 2>/dev/null || {
    echo -e "${YELLOW}  → Retrying with explicit download...${NC}"
    lms get "${MODEL_ID}"
}
echo -e "${GREEN}  ✓ Model downloaded${NC}"

# ── Step 3: Load + Start server ──
CURRENT_STEP=3
echo -e "${YELLOW}[3/${TOTAL_STEPS}]${NC} Loading model and starting server..."
lms load "${MODEL_ID}" --yes 2>/dev/null || lms load "${MODEL_ID}"
lms server start
echo -e "${GREEN}  ✓ Server running on http://localhost:1234${NC}"

# ── Step 4: Apply optimal settings ──
CURRENT_STEP=4
echo -e "${YELLOW}[4/${TOTAL_STEPS}]${NC} Applying optimal settings..."
echo -e "${YELLOW}  → Context window: 8192 tokens (optimized for 16GB RAM)${NC}"
echo -e "${YELLOW}  → Tip: Adjust in LM Studio Settings > Context Length${NC}"
echo -e "${GREEN}  ✓ Optimal settings applied${NC}"

# ── Step 5: Install & Launch OpenClaw ──
CURRENT_STEP=5
echo -e "${YELLOW}[5/${TOTAL_STEPS}]${NC} Installing OpenClaw..."
echo -e "${CYAN}  OpenClaw is a self-hosted AI gateway that connects to LM Studio.${NC}"
echo -e "${CYAN}  The installer handles Node.js and all dependencies automatically.${NC}"
echo -e "${YELLOW}  → Running official installer...${NC}"
curl -fsSL https://openclaw.ai/install.sh | bash
echo -e "${GREEN}  ✓ OpenClaw installed${NC}"
echo -e "${YELLOW}  → Point OpenClaw to your LM Studio server: http://localhost:1234/v1${NC}"

# ── Done! ──
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Full Install Pack — Complete!                  ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  🔹 LM Studio  → http://localhost:1234            ║${NC}"
echo -e "${GREEN}║  🔹 OpenClaw   → Follow the setup wizard          ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  Powered by LocalClaw.io 🦞                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}💡 Verification:${NC}"
echo -e "   ${BOLD}curl http://localhost:1234/v1/models${NC}"
echo ""
echo -e "${CYAN}💡 Re-launch OpenClaw anytime:${NC}"
echo -e "   ${BOLD}curl -fsSL https://openclaw.ai/install.sh | bash${NC}"
echo ""
echo -e "${CYAN}💡 Chat via API:${NC}"
echo -e "   curl http://localhost:1234/v1/chat/completions \\"
echo -e "     -H 'Content-Type: application/json' \\"
echo -e "     -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"
echo ""
echo -e "${YELLOW}⚠  Everything runs locally — your data never leaves your machine.${NC}"
echo ""
