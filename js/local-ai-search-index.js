(function exposeLocalAiSearchIndex(root) {
  root.LOCAL_AI_SEARCH_INDEX = [
  {
    "id": "gemma3-1b",
    "name": "Gemma 3 (1B)",
    "category": "llm",
    "summary": "Ultra-light model from Google. Perfect for quick responses on any machine. Incredibly fast.",
    "tasks": [
      "chat",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/gemma3-1b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi4-mini",
    "name": "Phi-4 Mini (3.8B)",
    "category": "llm",
    "summary": "Microsoft's latest small miracle. Punches way above its weight in reasoning & code.",
    "tasks": [
      "chat",
      "code",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/phi4-mini",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi4-14b",
    "name": "Phi-4 (14B)",
    "category": "llm",
    "summary": "Microsoft's full Phi-4. Compact powerhouse with exceptional reasoning and coding for its size. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "power",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 14,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/phi4-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-4b",
    "name": "Qwen 3 (4B)",
    "category": "llm",
    "summary": "Alibaba's think-then-answer model. Built-in chain-of-thought reasoning at just 4B params.",
    "tasks": [
      "chat",
      "code",
      "light",
      "speed",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/qwen3-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.2-3b",
    "name": "Llama 3.2 (3B)",
    "category": "llm",
    "summary": "Meta's compact powerhouse. Excellent instruction following for its size.",
    "tasks": [
      "chat",
      "light",
      "speed",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/llama3.2-3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "moondream2",
    "name": "Moondream 2",
    "category": "llm",
    "summary": "Tiny vision model. Surprisingly good at describing images and OCR. Runs on anything.",
    "tasks": [
      "vision",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/moondream2",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "lfm2-5-2-6b",
    "name": "LFM2.5-2.6B",
    "category": "llm",
    "summary": "Liquid AI compact hybrid model with 128K context, LFM 1.0 open weights, official GGUF, ONNX and MLX artifacts, and practical llama.cpp / LM Studio paths for 8GB-class local machines.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "light",
      "speed",
      "long-context",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07-28",
    "path": "/models/lfm2-5-2-6b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm4.7-flash",
    "name": "GLM 4.7 Flash",
    "category": "llm",
    "summary": "Zhipu AI's fast GLM model. 14B parameters optimized for quick responses with strong bilingual (CN/EN) capabilities. Efficient inference for everyday tasks. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "power",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/glm4.7-flash",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gpt-oss-20b",
    "name": "GPT-OSS (20B)",
    "category": "llm",
    "summary": "OpenAI open-weight reasoning model. Strong general, coding and tool-use capabilities under Apache 2.0. Practical on 16GB+ machines.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 14,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/gpt-oss-20b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gpt-oss-120b",
    "name": "GPT-OSS (120B)",
    "category": "llm",
    "summary": "OpenAI flagship open-weight reasoning model. 128K context, strong tool use and Apache 2.0 licensing, now practical for 96GB+ local workstations via GGUF MXFP4.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "beast",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 72,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/gpt-oss-120b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "longcat-flash-lite",
    "name": "LongCat-Flash-Lite",
    "category": "llm",
    "summary": "Meituan LongCat open-weight MoE with 68.5B total parameters, 3-4.5B active, MIT licensing and a 256K+ context window. Practical only for 64GB+ workstations through LongCat-specific GGUF/MLX runtimes.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agent",
      "power",
      "long-context",
      "moe"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 43,
    "runtime": [
      "LongCat llama.cpp fork / MLX"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-01",
    "path": "/models/longcat-flash-lite",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ling-flash-base-2.0",
    "name": "Ling Flash Base 2.0",
    "category": "llm",
    "summary": "InclusionAI MIT-licensed Ling 2.0 base MoE with about 106B total parameters, 6.1B active parameters and 32K context extendable toward 128K with YaRN. Practical local use requires the official Ling GGUF files and patched llama.cpp runtime.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "long-context",
      "moe"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 128,
    "min_vram_gb": 53,
    "runtime": [
      "Ling llama.cpp fork"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/ling-flash-base-2.0",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-coder-next",
    "name": "Qwen3-Coder-Next",
    "category": "llm",
    "summary": "Qwen Team Apache 2.0 coding-agent MoE with 80B total parameters, 3B active parameters, 262K native context and official Q4_K_M GGUF files. Practical local use fits best on 64GB+ workstations with recent llama.cpp or LM Studio-compatible runtimes.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agent",
      "power",
      "long-context",
      "moe",
      "tool-calling"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 55,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-02",
    "path": "/models/qwen3-coder-next",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nanbeige4.2-3b",
    "name": "Nanbeige4.2 3B",
    "category": "llm",
    "summary": "Nanbeige compact Apache 2.0 agentic model with 256K context, strong official code-agent and office-agent claims, and practical Q4_K_M GGUF/Ollama paths through Nanbeige-compatible llama.cpp runtimes.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agent",
      "light",
      "long-context",
      "tool-calling"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 3,
    "runtime": [
      "Nanbeige llama.cpp / Ollama fork"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07",
    "path": "/models/nanbeige4.2-3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "agents-a1-4b",
    "name": "Agents-A1 4B",
    "category": "llm",
    "summary": "InternScience compact dense agent model with Apache 2.0 licensing, 262K context and official Q4_K_M GGUF artifacts for 8GB-class local assistants.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "vision",
      "agentic",
      "tool-calling",
      "light",
      "long-context"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07",
    "path": "/models/agents-a1-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "laguna-s-2.1",
    "name": "Laguna S 2.1",
    "category": "llm",
    "summary": "Poolside workstation-class coding MoE with 1M context, 118B total / 8B active parameters, OpenMDW-1.1 licensing and official Q4_K_M GGUF plus Ollama availability.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agent",
      "beast",
      "long-context",
      "tool-calling"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 86,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07",
    "path": "/models/laguna-s-2.1",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "hy3",
    "name": "Hy3",
    "category": "llm",
    "summary": "Tencent Hy Team MoE model with 256K context, strong agent/productivity benchmarks and Apache 2.0 licensing. Practical only for very large local workstations via IQ1_M GGUF.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "beast",
      "tool-calling",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 128,
    "min_vram_gb": 102,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07",
    "path": "/models/hy3",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "bonsai-27b",
    "name": "Bonsai 27B",
    "category": "llm",
    "summary": "PrismML low-bit model derived from Qwen 3.6 27B. Official Apache 2.0 ternary (7.2GB deployed) and 1-bit (3.9GB) builds retain multimodal, reasoning and agentic capabilities through custom GGUF and MLX runtimes.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "vision",
      "agentic",
      "multimodal",
      "edge",
      "speed",
      "long-context"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 9,
    "runtime": [
      "PrismML llama.cpp / MLX"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07",
    "path": "/models/bonsai-27b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "laguna-xs-2.1",
    "name": "Laguna XS 2.1",
    "category": "llm",
    "summary": "Poolside agentic coding MoE with 262K context, 33B total / 3B active parameters, OpenMDW-1.1 licensing and official Q4_K_M GGUF plus Ollama availability for 36GB-class local machines.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agent",
      "power",
      "long-context"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 36,
    "min_vram_gb": 24,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07",
    "path": "/models/laguna-xs-2.1",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "lfm2.5-8b-a1b",
    "name": "LFM2.5-8B-A1B",
    "category": "llm",
    "summary": "Liquid AI hybrid model built for on-device assistants. 8.3B total / 1.5B active, 128K context, tool use, GGUF, ONNX, MLX, llama.cpp and LM Studio support. Open-weight under LFM 1.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "speed",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/lfm2.5-8b-a1b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "minicpm5-1b",
    "name": "MiniCPM5 1B",
    "category": "llm",
    "summary": "OpenBMB compact on-device LLM with Apache 2.0 licensing, 128K context, tool-calling focus and official GGUF plus MLX artifacts for laptops and edge devices.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "light",
      "speed",
      "tool-calling",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 1,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/minicpm5-1b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite4.1-3b",
    "name": "Granite 4.1 (3B)",
    "category": "llm",
    "summary": "IBM Granite 4.1 compact long-context instruct model. Apache 2.0, 131K context, tool calling, RAG and code tasks, with an official Q4_K_M GGUF for practical 4-8 GB local machines.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "light",
      "speed",
      "tool-calling",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-04-29",
    "path": "/models/granite4.1-3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite4.1-8b",
    "name": "Granite 4.1 (8B)",
    "category": "llm",
    "summary": "IBM Granite 4.1 long-context instruct model. Apache 2.0, 131K context, tool calling, RAG, code tasks, multilingual dialog and business assistant workflows on normal 8-16 GB machines.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-04",
    "path": "/models/granite4.1-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-small-4-119b",
    "name": "Mistral Small 4 (119B-A6.5B)",
    "category": "llm",
    "summary": "Mistral AI hybrid instruct, reasoning and coding MoE. Apache 2.0, 256K context, multimodal input, official NVFP4 weights and a practical Q4_K_M GGUF for high-memory offline workstations.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "vision",
      "agent",
      "power",
      "long-context",
      "multilingual"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 82,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03-16",
    "path": "/models/mistral-small-4-119b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "sarvam-30b",
    "name": "Sarvam 30B",
    "category": "llm",
    "summary": "Sarvam AI open-weight MoE model trained for Indian languages, coding, reasoning, tool use and practical local deployment. Apache 2.0 with official GGUF availability.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "multilingual",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/sarvam-30b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "olmo3-32b-think",
    "name": "OLMo 3 32B Think",
    "category": "llm",
    "summary": "Ai2 fully open reasoning model with weights, data, code and training details. Strong 32B thinking model with GGUF and MLX artifacts for local workstations.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "open-data"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-11",
    "path": "/models/olmo3-32b-think",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "olmo3-7b-instruct",
    "name": "OLMo 3 7B Instruct",
    "category": "llm",
    "summary": "Ai2 fully open 7B OLMo 3 instruct model with Apache 2.0 licensing, transparent training artifacts and established GGUF options from Unsloth, bartowski and LM Studio for everyday local machines.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "standard",
      "open-data"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-11",
    "path": "/models/olmo3-7b-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen-agentworld-35b-a3b",
    "name": "Qwen AgentWorld 35B-A3B",
    "category": "llm",
    "summary": "Official Qwen language world model for simulating agent environments across terminal, web, OS, Android, search, SWE and tool-calling domains. Apache 2.0 with active GGUF and MLX quantizations.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agent",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/qwen-agentworld-35b-a3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "north-mini-code-1.0",
    "name": "North Mini Code 1.0",
    "category": "llm",
    "summary": "Cohere Labs Apache 2.0 coding and agent model. 30B total / 3B active MoE, 256K context, terminal-task training and mature GGUF quantizations for local workstation use.",
    "tasks": [
      "code",
      "agent",
      "reasoning",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/north-mini-code-1.0",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "agents-a1",
    "name": "Agents-A1",
    "category": "llm",
    "summary": "InternScience Apache 2.0 agentic VLM. 35B-A3B MoE, 262K context, strong long-horizon search/tool-use benchmarks and official Q4_K_M GGUF artifacts for local workstations.",
    "tasks": [
      "chat",
      "code",
      "vision",
      "agent",
      "reasoning",
      "power",
      "tool-calling",
      "multimodal"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 24,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/agents-a1",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "apertus-8b-instruct",
    "name": "Apertus 8B Instruct",
    "category": "llm",
    "summary": "Swiss AI Initiative fully open multilingual model with open weights, open data, open training artifacts and Apache 2.0 licensing. Practical 8B local option with GGUF and MLX community builds.",
    "tasks": [
      "chat",
      "standard",
      "multilingual",
      "open-data",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/apertus-8b-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "diffusiongemma-26b-a4b-it",
    "name": "DiffusionGemma 26B-A4B Instruct",
    "category": "llm",
    "summary": "Official Google Apache 2.0 diffusion-language Gemma model with image-text chat support. Strong local relevance thanks to active Unsloth GGUF quantizations for workstation-class machines.",
    "tasks": [
      "chat",
      "vision",
      "reasoning",
      "power",
      "multimodal"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 19,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/diffusiongemma-26b-a4b-it",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v3.1",
    "name": "DeepSeek V3.1 (671B MoE)",
    "category": "llm",
    "summary": "Hybrid thinking/non-thinking model. Full 671B MoE for maximum quality, 37B active at inference. Significant step up from V3.0. Requires server-grade hardware. MIT licensed.",
    "tasks": [
      "chat",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 512,
    "min_vram_gb": 410,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/deepseek-v3.1",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.1-8b",
    "name": "Llama 3.1 (8B)",
    "category": "llm",
    "summary": "Meta's state-of-the-art open model. 128K context, strong multilingual support. 104M+ downloads. Industry standard.",
    "tasks": [
      "chat",
      "general",
      "standard",
      "code"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/llama3.1-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.1-70b",
    "name": "Llama 3.1 (70B)",
    "category": "llm",
    "summary": "Meta's 70B with 128K context. Solid but superseded by Llama 3.3 70B and newer models like GLM 4.5 Air.",
    "tasks": [
      "chat",
      "code",
      "general",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 46,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/llama3.1-70b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.2-1b",
    "name": "Llama 3.2 (1B)",
    "category": "llm",
    "summary": "Meta's ultra-compact edge model. Runs on anything with 4GB RAM. Great for quick tasks and edge devices.",
    "tasks": [
      "chat",
      "light",
      "speed",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 1,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/llama3.2-1b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5-7b",
    "name": "Qwen 2.5 (7B)",
    "category": "llm",
    "summary": "Alibaba's 18T token trained model. Excellent multilingual and coding. 14.9M downloads. Wide community support.",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/qwen2.5-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5-14b",
    "name": "Qwen 2.5 (14B)",
    "category": "llm",
    "summary": "Strong 14B from Alibaba. 18T tokens training. Excellent for multilingual tasks and coding.",
    "tasks": [
      "chat",
      "code",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/qwen2.5-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5-72b",
    "name": "Qwen 2.5 (72B)",
    "category": "llm",
    "summary": "Alibaba's massive 72B. Among the best open models globally. Exceptional multilingual + coding + reasoning.",
    "tasks": [
      "chat",
      "code",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/qwen2.5-72b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi3-3.8b",
    "name": "Phi-3 (3.8B)",
    "category": "llm",
    "summary": "Microsoft lightweight powerhouse. Punches way above its weight. 11.3M downloads. Great for edge devices.",
    "tasks": [
      "chat",
      "reasoning",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/phi3-3.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi3-14b",
    "name": "Phi-3 Medium (14B)",
    "category": "llm",
    "summary": "Microsoft's medium Phi-3. Strong reasoning capabilities for its size. Good balance of speed and quality.",
    "tasks": [
      "chat",
      "reasoning",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/phi3-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3-8b",
    "name": "Llama 3 (8B)",
    "category": "llm",
    "summary": "Meta Llama 3 original. Rock-solid foundation model. 11.2M downloads. Widely supported and fine-tuned.",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/llama3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llava-13b",
    "name": "LLaVA 1.6 (13B)",
    "category": "llm",
    "summary": "Larger LLaVA multimodal. Better image understanding than 7B. Describe, analyze and discuss images.",
    "tasks": [
      "vision",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-02",
    "path": "/models/llava-13b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma2-9b",
    "name": "Gemma 2 (9B)",
    "category": "llm",
    "summary": "Google Gemma 2nd gen. Excellent quality-to-size ratio. 8.1M downloads. Great all-around model.",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-06",
    "path": "/models/gemma2-9b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma2-27b",
    "name": "Gemma 2 (27B)",
    "category": "llm",
    "summary": "Google's large Gemma 2. Excellent reasoning and coding. Strong performance at 27B.",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 19,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-06",
    "path": "/models/gemma2-27b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5-coder-32b",
    "name": "Qwen 2.5 Coder (32B)",
    "category": "llm",
    "summary": "Best open-source code model at 32B. Outstanding code generation, completion and refactoring. 7.5M downloads.",
    "tasks": [
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/qwen2.5-coder-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-7b",
    "name": "DeepSeek R1 Distill (7B)",
    "category": "llm",
    "summary": "DeepSeek's reasoning model distilled to 7B. Shows thought process step-by-step. 65.5M downloads total.",
    "tasks": [
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/deepseek-r1-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-70b",
    "name": "DeepSeek R1 Distill (70B)",
    "category": "llm",
    "summary": "Massive reasoning distill at 70B. Good for pure reasoning but outperformed by GLM 4.5 Air and newer flagship models overall.",
    "tasks": [
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 46,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/deepseek-r1-70b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "minicpm-v-8b",
    "name": "MiniCPM-V (8B)",
    "category": "llm",
    "summary": "Compact multimodal VLM. Strong image understanding in a small package. 3.6M downloads.",
    "tasks": [
      "vision",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-08",
    "path": "/models/minicpm-v-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "dolphin3-8b",
    "name": "Dolphin 3 (8B)",
    "category": "llm",
    "summary": "Uncensored general purpose model with function calling. No content filters. 3.1M downloads.",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/dolphin3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "olmo2-7b",
    "name": "OLMo 2 (7B)",
    "category": "llm",
    "summary": "Allen AI fully open model. Weights, data, code all public. Great for research. 3M downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/olmo2-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "tinyllama-1.1b",
    "name": "TinyLlama (1.1B)",
    "category": "llm",
    "summary": "Compact 1.1B trained on 3T tokens. Great for ultra-low resource environments. 3M downloads.",
    "tasks": [
      "chat",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 1,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-01",
    "path": "/models/tinyllama-1.1b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-nemo-12b",
    "name": "Mistral Nemo (12B)",
    "category": "llm",
    "summary": "Mistral x NVIDIA 128K context model. Excellent for long documents and conversations. 2.7M downloads.",
    "tasks": [
      "chat",
      "general",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 9,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/mistral-nemo-12b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.2-vision-11b",
    "name": "Llama 3.2 Vision (11B)",
    "category": "llm",
    "summary": "Meta's vision-enabled Llama. Image reasoning + text generation. 2.6M downloads.",
    "tasks": [
      "vision",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 8,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/llama3.2-vision-11b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v3-671b",
    "name": "DeepSeek V3 (671B MoE)",
    "category": "llm",
    "summary": "671B MoE with 37B active params. The original massive DeepSeek. 2.4M downloads. Server-grade only.",
    "tasks": [
      "chat",
      "code",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 512,
    "min_vram_gb": 410,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-12",
    "path": "/models/deepseek-v3-671b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "smollm2-1.7b",
    "name": "SmolLM 2 (1.7B)",
    "category": "llm",
    "summary": "Ultra-compact HuggingFace model. Surprisingly capable for its tiny size. 1.9M downloads.",
    "tasks": [
      "chat",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/smollm2-1.7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwq-32b",
    "name": "QwQ (32B)",
    "category": "llm",
    "summary": "Early Qwen reasoning model. Superseded by GLM-4 32B and Qwen 3 32B for most tasks. Still decent for pure math.",
    "tasks": [
      "reasoning",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/qwq-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-coder-33b",
    "name": "DeepSeek Coder (33B)",
    "category": "llm",
    "summary": "DeepSeek code specialist. Excellent at code generation and completion. 1.4M downloads.",
    "tasks": [
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-01",
    "path": "/models/deepseek-coder-33b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mixtral-8x7b",
    "name": "Mixtral (8x7B)",
    "category": "llm",
    "summary": "Mistral's MoE pioneer. 46.7B total, fast inference via sparse activation. Multilingual. 1.4M downloads.",
    "tasks": [
      "chat",
      "general",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 30,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-01",
    "path": "/models/mixtral-8x7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "starcoder2-15b",
    "name": "StarCoder 2 (15B)",
    "category": "llm",
    "summary": "Transparent open code LLM. 600+ languages. Trained on The Stack v2. 1.3M downloads.",
    "tasks": [
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-02",
    "path": "/models/starcoder2-15b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "codegemma-7b",
    "name": "CodeGemma (7B)",
    "category": "llm",
    "summary": "Google code completion model. Excellent for inline code suggestions. 1.2M downloads.",
    "tasks": [
      "code",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/codegemma-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-coder-v2-16b",
    "name": "DeepSeek Coder V2 (16B)",
    "category": "llm",
    "summary": "MoE code model rivaling GPT4-Turbo on coding benchmarks. 1.1M downloads.",
    "tasks": [
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-06",
    "path": "/models/deepseek-coder-v2-16b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "falcon3-7b",
    "name": "Falcon 3 (7B)",
    "category": "llm",
    "summary": "TII efficient model. Strong performance under 10B. Great for science and math. 849K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-12",
    "path": "/models/falcon3-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5vl-7b",
    "name": "Qwen 2.5 VL (7B)",
    "category": "llm",
    "summary": "Qwen flagship vision-language model. Excellent at image understanding. 732K downloads.",
    "tasks": [
      "vision",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/qwen2.5vl-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama4-scout",
    "name": "Llama 4 Scout (17B/16E MoE)",
    "category": "llm",
    "summary": "Meta's multimodal MoE model. 17B active params across 16 experts (~109B total). Built-in image understanding. 10M token context window. Apache 2.0. 728K downloads.",
    "tasks": [
      "chat",
      "vision",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 12,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/llama4-scout",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama4-maverick",
    "name": "Llama 4 Maverick (17B/128E MoE)",
    "category": "llm",
    "summary": "Meta's largest open MoE. 17B active params across 128 experts (~400B total). Multimodal with exceptional image reasoning. Server-grade hardware required. Llama 4 License.",
    "tasks": [
      "chat",
      "vision",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 320,
    "min_vram_gb": 250,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/llama4-maverick",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "dolphin-mixtral-8x7b",
    "name": "Dolphin Mixtral (8x7B)",
    "category": "llm",
    "summary": "Uncensored Mixtral fine-tune. No content filters. Popular for unrestricted chat. 708K downloads.",
    "tasks": [
      "chat",
      "code",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 30,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-03",
    "path": "/models/dolphin-mixtral-8x7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-small3.2-24b",
    "name": "Mistral Small 3.2 (24B)",
    "category": "llm",
    "summary": "Improved Mistral Small with function calling. Great for tool-use and agents. 677K downloads.",
    "tasks": [
      "chat",
      "general",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 20,
    "min_vram_gb": 16,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-06",
    "path": "/models/mistral-small3.2-24b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ministral-3-3b-instruct",
    "name": "Ministral 3 3B Instruct",
    "category": "llm",
    "summary": "Mistral AI compact multimodal instruct model. Apache 2.0, strong local app support through official GGUF, LM Studio, Ollama and llama.cpp artifacts. Practical on normal laptops.",
    "tasks": [
      "chat",
      "vision",
      "light",
      "speed",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/ministral-3-3b-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ministral-3-8b-instruct",
    "name": "Ministral 3 8B Instruct",
    "category": "llm",
    "summary": "Mistral AI mid-size multimodal instruct model. Apache 2.0, official GGUF availability, strong multilingual chat and vision-capable local assistant fit for 8-16GB machines.",
    "tasks": [
      "chat",
      "vision",
      "standard",
      "general",
      "multilingual"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/ministral-3-8b-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ministral-3-14b-instruct",
    "name": "Ministral 3 14B Instruct",
    "category": "llm",
    "summary": "Mistral AI larger Ministral 3 instruct model. Apache 2.0, official GGUF availability, better quality ceiling than the 3B/8B variants while staying practical on 16-32GB workstations.",
    "tasks": [
      "chat",
      "vision",
      "power",
      "reasoning",
      "multilingual"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/ministral-3-14b-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite3.3-8b",
    "name": "Granite 3.3 (8B)",
    "category": "llm",
    "summary": "IBM 128K context with reasoning. Thinking capabilities at 8B. 604K downloads.",
    "tasks": [
      "chat",
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/granite3.3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "openthinker-7b",
    "name": "OpenThinker (7B)",
    "category": "llm",
    "summary": "Open reasoning model distilled from DeepSeek R1. Excellent chain-of-thought. 601K downloads.",
    "tasks": [
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/openthinker-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "cogito-8b",
    "name": "Cogito (8B)",
    "category": "llm",
    "summary": "Hybrid reasoning model outperforming peers. Strong general + reasoning at 8B. 558K downloads.",
    "tasks": [
      "chat",
      "reasoning",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/cogito-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "cogito-32b",
    "name": "Cogito (32B)",
    "category": "llm",
    "summary": "Hybrid reasoning at 32B. Outperforms larger models on reasoning tasks. Strong general purpose.",
    "tasks": [
      "chat",
      "reasoning",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/cogito-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma3n-4b",
    "name": "Gemma 3n (4B)",
    "category": "llm",
    "summary": "Google Gemma for phones/tablets/laptops. Optimized for mobile and edge. 552K downloads.",
    "tasks": [
      "chat",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-06",
    "path": "/models/gemma3n-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi4-reasoning-14b",
    "name": "Phi-4 Reasoning (14B)",
    "category": "llm",
    "summary": "Microsoft Phi-4 reasoning variant. Top choice for 14B reasoning - much better than DeepSeek R1 14B. Rivals larger models on math & logic.",
    "tasks": [
      "reasoning",
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/phi4-reasoning-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "magistral-24b",
    "name": "Magistral (24B)",
    "category": "llm",
    "summary": "Mistral efficient reasoning model. Strong chain-of-thought at 24B. 477K downloads.",
    "tasks": [
      "reasoning",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 20,
    "min_vram_gb": 16,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/magistral-24b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-coder-8b",
    "name": "Qwen 3 Coder (8B)",
    "category": "llm",
    "summary": "Qwen coding specialist with long context. Great for agentic coding tasks. 477K downloads.",
    "tasks": [
      "code",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/qwen3-coder-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "codestral-22b",
    "name": "Codestral (22B)",
    "category": "llm",
    "summary": "Mistral's first code model. Supports 80+ programming languages. 476K downloads.",
    "tasks": [
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 15,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-05",
    "path": "/models/codestral-22b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepscaler-1.5b",
    "name": "DeepScaleR (1.5B)",
    "category": "llm",
    "summary": "Tiny model beating o1-preview on math! Incredible reasoning-to-size ratio. 474K downloads.",
    "tasks": [
      "reasoning",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/deepscaler-1.5b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi4-mini-reasoning",
    "name": "Phi-4 Mini Reasoning (3.8B)",
    "category": "llm",
    "summary": "Phi-4 mini balanced reasoning variant. Good chain-of-thought at tiny size. 62K downloads.",
    "tasks": [
      "reasoning",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/phi4-mini-reasoning",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "devstral-24b",
    "name": "Devstral (24B)",
    "category": "llm",
    "summary": "Best open model for coding agents. Designed for agentic coding workflows. 391K downloads.",
    "tasks": [
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 20,
    "min_vram_gb": 16,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/devstral-24b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite3.2-vision-2b",
    "name": "Granite 3.2 Vision (2B)",
    "category": "llm",
    "summary": "IBM vision model for document extraction. Tiny but effective at understanding documents. 365K downloads.",
    "tasks": [
      "vision",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/granite3.2-vision-2b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "command-r-35b",
    "name": "Command R (35B)",
    "category": "llm",
    "summary": "Cohere optimized for RAG and long-context. 128K context. Excellent retrieval-augmented generation. 354K downloads.",
    "tasks": [
      "chat",
      "general",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-03",
    "path": "/models/command-r-35b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "hermes3-8b",
    "name": "Hermes 3 (8B)",
    "category": "llm",
    "summary": "Nous Research flagship with function calling. Versatile and well-tuned. 340K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-08",
    "path": "/models/hermes3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi3.5-3.8b",
    "name": "Phi-3.5 (3.8B)",
    "category": "llm",
    "summary": "Phi 3.5 overtaking larger models. Excellent small model from Microsoft. 333K downloads.",
    "tasks": [
      "chat",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-08",
    "path": "/models/phi3.5-3.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "phi3.5-moe-instruct",
    "name": "Phi-3.5 MoE Instruct",
    "category": "llm",
    "summary": "Microsoft Phi-3.5 MoE: compact mixture-of-experts model with only ~6.6B active parameters. Strong reasoning and coding for local power users. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "moe"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 28,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/phi3.5-moe-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepcoder-14b",
    "name": "DeepCoder (14B)",
    "category": "llm",
    "summary": "O3-mini level open coder. Strong reasoning + coding combo. 326K downloads.",
    "tasks": [
      "code",
      "reasoning",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/deepcoder-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-small3.1-24b",
    "name": "Mistral Small 3.1 (24B)",
    "category": "llm",
    "summary": "Mistral Small + vision + 128K context. See and understand images. 311K downloads.",
    "tasks": [
      "chat",
      "vision",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 20,
    "min_vram_gb": 16,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/mistral-small3.1-24b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "yi-34b",
    "name": "Yi 1.5 (34B)",
    "category": "llm",
    "summary": "High-performing bilingual (EN/CN) model. Strong at general tasks. 305K downloads.",
    "tasks": [
      "chat",
      "general",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-05",
    "path": "/models/yi-34b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "zephyr-7b",
    "name": "Zephyr (7B)",
    "category": "llm",
    "summary": "Fine-tuned Mistral as helpful assistant. DPO-aligned for safety. 291K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2023-11",
    "path": "/models/zephyr-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-large-123b",
    "name": "Mistral Large (123B)",
    "category": "llm",
    "summary": "Mistral flagship. 128K context. Top-tier coding and multilingual. 262K downloads. Requires serious hardware.",
    "tasks": [
      "chat",
      "code",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 80,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/mistral-large-123b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "exaone-deep-7.8b",
    "name": "EXAONE Deep (7.8B)",
    "category": "llm",
    "summary": "LG AI Research reasoning model. Strong at math and coding reasoning. 200K downloads.",
    "tasks": [
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/exaone-deep-7.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "exaone-deep-32b",
    "name": "EXAONE Deep (32B)",
    "category": "llm",
    "summary": "LG AI Research large reasoning model. Exceptional math and coding. 200K downloads.",
    "tasks": [
      "reasoning",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/exaone-deep-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "openchat-7b",
    "name": "OpenChat 3.5 (7B)",
    "category": "llm",
    "summary": "Open-source beating ChatGPT 3.5 on benchmarks. Great chat quality. 201K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-01",
    "path": "/models/openchat-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "codegeex4-9b",
    "name": "CodeGeeX4 (9B)",
    "category": "llm",
    "summary": "Versatile code completion model from THUDM. Multi-language coding. 187K downloads.",
    "tasks": [
      "code",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/codegeex4-9b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "aya-8b",
    "name": "Aya (8B)",
    "category": "llm",
    "summary": "Cohere 23-language multilingual model. Excellent for non-English conversations. 164K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-05",
    "path": "/models/aya-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "aya-expanse-32b",
    "name": "Aya Expanse (32B)",
    "category": "llm",
    "summary": "Cohere 23-language improved model. Strong multilingual at 32B. 86K downloads.",
    "tasks": [
      "chat",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-10",
    "path": "/models/aya-expanse-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "smallthinker-3b",
    "name": "SmallThinker (3B)",
    "category": "llm",
    "summary": "Small reasoning model on Qwen 2.5 3B. Thinking at a tiny size. 83K downloads.",
    "tasks": [
      "reasoning",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/smallthinker-3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "r1-1776-14b",
    "name": "R1-1776 (671B MoE)",
    "category": "llm",
    "summary": "Perplexity R1-1776 is a full DeepSeek-R1 derivative with 671B total parameters and about 37B active per token. The verified Q4_K_M GGUF is roughly 404.4 GB, so this is a server-grade local target rather than a desktop 14B model. This legacy route ID is retained for URL stability.",
    "tasks": [
      "reasoning",
      "server-grade",
      "moe"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 512,
    "min_vram_gb": 460,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/r1-1776-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "command-a-111b",
    "name": "Command A (111B)",
    "category": "llm",
    "summary": "Cohere enterprise flagship. Top-tier for RAG and enterprise use. 58K downloads.",
    "tasks": [
      "chat",
      "general",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 80,
    "min_vram_gb": 73,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/command-a-111b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite4-8b",
    "name": "Granite 4 (8B)",
    "category": "llm",
    "summary": "IBM latest instruction + tool-use model. Best Granite yet. 20K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/granite4-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nemotron-mini-4b",
    "name": "Nemotron Mini (4B)",
    "category": "llm",
    "summary": "NVIDIA small model for RAG + roleplay + function calling. Compact and versatile. 107K downloads.",
    "tasks": [
      "chat",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-08",
    "path": "/models/nemotron-mini-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nemotron3-nano-4b",
    "name": "Nemotron 3 Nano (4B)",
    "category": "llm",
    "summary": "⭐ Mac Mini M4 16GB top pick! NVIDIA's hybrid model - distilled from 9B, keeps 95% of its quality. Hybrid attention + SSM layers = ~80–120 tok/s on Apple Silicon. Blazing fast, minimal RAM. NVIDIA Open Model License.",
    "tasks": [
      "chat",
      "light",
      "speed",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/nemotron3-nano-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.1-nemotron-nano-4b",
    "name": "Llama-3.1-Nemotron-Nano (4B)",
    "category": "llm",
    "summary": "⭐ Mac Mini M4 16GB top pick! NVIDIA fine-tune of Llama 3.1. Hybrid /think • /no_think mode - deep reasoning on demand, instant chat otherwise. ~80–120 tok/s on Apple Silicon Metal. 128K context. Apache 2.0.",
    "tasks": [
      "chat",
      "light",
      "speed",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/llama3.1-nemotron-nano-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "tulu3-8b",
    "name": "Tulu 3 (8B)",
    "category": "llm",
    "summary": "Allen AI fully open instruction model. Weights, data, code all public. 106K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/tulu3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "internlm2-7b",
    "name": "InternLM 2.5 (7B)",
    "category": "llm",
    "summary": "Practical reasoning model from Shanghai AI Lab. Strong bilingual. 101K downloads.",
    "tasks": [
      "chat",
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/internlm2-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "athene-v2-72b",
    "name": "Athene V2 (72B)",
    "category": "llm",
    "summary": "72B excelling at code + math. Solid benchmarks but overshadowed by newer 2026 models. 99K downloads.",
    "tasks": [
      "code",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/athene-v2-72b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "marco-o1-7b",
    "name": "Marco-o1 (7B)",
    "category": "llm",
    "summary": "Alibaba open reasoning model. Good chain-of-thought reasoning at 7B. 52K downloads.",
    "tasks": [
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/marco-o1-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "reader-lm-1.5b",
    "name": "Reader LM (1.5B)",
    "category": "llm",
    "summary": "HTML to Markdown converter. Specialized utility model for web scraping. 65K downloads.",
    "tasks": [
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/reader-lm-1.5b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llava-llama3-8b",
    "name": "LLaVA-Llama3 (8B)",
    "category": "llm",
    "summary": "LLaVA fine-tuned on Llama 3. Improved vision understanding. 1.9M downloads.",
    "tasks": [
      "vision",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/llava-llama3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2-math-72b",
    "name": "Qwen2 Math (72B)",
    "category": "llm",
    "summary": "Qwen2 math specialist beating GPT4o on math benchmarks. 173K downloads.",
    "tasks": [
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-08",
    "path": "/models/qwen2-math-72b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "yi-coder-9b",
    "name": "Yi Coder (9B)",
    "category": "llm",
    "summary": "Yi code specialist under 10B. Strong coding performance for its size. 132K downloads.",
    "tasks": [
      "code",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/yi-coder-9b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3-chatqa-8b",
    "name": "Llama3 ChatQA (8B)",
    "category": "llm",
    "summary": "NVIDIA RAG-optimized Llama 3. Excellent for question answering. 128K downloads.",
    "tasks": [
      "chat",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-05",
    "path": "/models/llama3-chatqa-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llava-phi3-3.8b",
    "name": "LLaVA-Phi3 (3.8B)",
    "category": "llm",
    "summary": "Small LLaVA on Phi 3. Vision understanding at ultra-compact size. 126K downloads.",
    "tasks": [
      "vision",
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-05",
    "path": "/models/llava-phi3-3.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mathstral-7b",
    "name": "Mathstral (7B)",
    "category": "llm",
    "summary": "Mistral math/science specialist. Optimized for math problem solving. 56K downloads.",
    "tasks": [
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-07",
    "path": "/models/mathstral-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nuextract-3.8b",
    "name": "NuExtract (3.8B)",
    "category": "llm",
    "summary": "Information extraction specialist on Phi-3. Great for structured data extraction. 43K downloads.",
    "tasks": [
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-06",
    "path": "/models/nuextract-3.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "bespoke-minicheck",
    "name": "Bespoke MiniCheck (3.8B)",
    "category": "llm",
    "summary": "Fact-checking specialist model. Verify claims and detect hallucinations. 44K downloads.",
    "tasks": [
      "light",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 3,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-10",
    "path": "/models/bespoke-minicheck",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "sqlcoder-15b",
    "name": "SQLCoder (15B)",
    "category": "llm",
    "summary": "Specialized text-to-SQL model. Generates SQL queries from natural language. 135K downloads.",
    "tasks": [
      "code",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-01",
    "path": "/models/sqlcoder-15b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "sailor2-8b",
    "name": "Sailor 2 (8B)",
    "category": "llm",
    "summary": "Southeast Asian multilingual specialist. Thai, Vietnamese, Indonesian, etc. 35K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-12",
    "path": "/models/sailor2-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "exaone3.5-7.8b",
    "name": "EXAONE 3.5 (7.8B)",
    "category": "llm",
    "summary": "LG AI bilingual model (EN/KR). Strong performance at 7.8B. 118K downloads.",
    "tasks": [
      "chat",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-12",
    "path": "/models/exaone3.5-7.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama-guard3-8b",
    "name": "Llama Guard 3 (8B)",
    "category": "llm",
    "summary": "Meta's content safety classifier. Detect unsafe content in LLM outputs. 86K downloads.",
    "tasks": [
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/llama-guard3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "opencoder-8b",
    "name": "OpenCoder (8B)",
    "category": "llm",
    "summary": "Open reproducible code LLM. Fully transparent training. Bilingual coding. 172K downloads.",
    "tasks": [
      "code",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/opencoder-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "solar-pro-22b",
    "name": "Solar Pro (22B)",
    "category": "llm",
    "summary": "22B single-GPU advanced LLM. Compact but powerful. 50K downloads.",
    "tasks": [
      "chat",
      "general",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 15,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/solar-pro-22b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "dbrx-132b",
    "name": "DBRX (132B MoE)",
    "category": "llm",
    "summary": "Databricks open MoE LLM. 132B total with 36B active. Strong general purpose. 111K downloads.",
    "tasks": [
      "chat",
      "general",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 128,
    "min_vram_gb": 123,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-03",
    "path": "/models/dbrx-132b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-8b",
    "name": "Qwen 3 (8B)",
    "category": "llm",
    "summary": "One of the best 8B models ever made. Thinking mode + lightning fast. The new king of 8B.",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/qwen3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.3-8b",
    "name": "Llama 3.3 (8B)",
    "category": "llm",
    "summary": "Meta's refined 8B. Best all-around model for general use. Rock-solid instruction following.",
    "tasks": [
      "chat",
      "general",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/llama3.3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma3-4b",
    "name": "Gemma 3 (4B)",
    "category": "llm",
    "summary": "Google's multimodal gem. Understands text AND images natively. Great quality-to-size ratio.",
    "tasks": [
      "chat",
      "vision",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/gemma3-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-7b-v0.3",
    "name": "Mistral 7B v0.3",
    "category": "llm",
    "summary": "The legendary Mistral. Still incredibly fast and reliable for everyday tasks.",
    "tasks": [
      "chat",
      "general",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-05",
    "path": "/models/mistral-7b-v0.3",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-8b",
    "name": "DeepSeek R1 Distill (8B)",
    "category": "llm",
    "summary": "DeepSeek's reasoning model distilled to 8B. Shows its thought process step-by-step. Mind-blowing for logic.",
    "tasks": [
      "chat",
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/deepseek-r1-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5-coder-7b",
    "name": "Qwen 2.5 Coder (7B)",
    "category": "llm",
    "summary": "Specialized coding powerhouse. Best-in-class for code generation, completion and debugging at 7B.",
    "tasks": [
      "code",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/qwen2.5-coder-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llava-1.6-7b",
    "name": "LLaVA 1.6 (7B)",
    "category": "llm",
    "summary": "The original multimodal hero. Drag & drop images into LM Studio to discuss them.",
    "tasks": [
      "vision",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-02",
    "path": "/models/llava-1.6-7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm4.5-air",
    "name": "GLM 4.5 Air (MoE)",
    "category": "llm",
    "summary": "Z.ai open-weight MoE with 106B total parameters and about 12B active per token. The verified Q4_K_M GGUF is roughly 73.0 GB, placing it in the 96 GB workstation class. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 83,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/glm4.5-air",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "step3.5-flash",
    "name": "Step 3.5 Flash",
    "category": "llm",
    "summary": "StepFun open-weight sparse MoE with 196.81B total parameters and about 11B active per token. The verified GGUF currently provides Q4_K at roughly 118.7 GB, requiring a high-memory workstation. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "power",
      "reasoning",
      "moe"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 192,
    "min_vram_gb": 135,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-11",
    "path": "/models/step3.5-flash",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-14b",
    "name": "Qwen 3 (14B)",
    "category": "llm",
    "summary": "The sweet spot. Incredible reasoning, coding and chat quality. The best model you can run on 16GB.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/qwen3-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma3-12b",
    "name": "Gemma 3 (12B)",
    "category": "llm",
    "summary": "Google's 12B multimodal beast. Understands images natively. Excellent quality for 16GB machines.",
    "tasks": [
      "chat",
      "vision",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/gemma3-12b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma4-12b",
    "name": "Gemma 4 12B",
    "category": "llm",
    "summary": "Google DeepMind 12B unified multimodal model. Text, image, audio and video inputs, 256K context, Apache 2.0, and a strong local sweet spot for 16-32 GB machines.",
    "tasks": [
      "chat",
      "vision",
      "audio",
      "code",
      "reasoning",
      "power",
      "multimodal",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/gemma4-12b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "codellama-34b",
    "name": "CodeLlama 34B",
    "category": "llm",
    "summary": "Massive coding model. Handles complex refactoring, architecture, and multi-file edits.",
    "tasks": [
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-01",
    "path": "/models/codellama-34b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-14b",
    "name": "DeepSeek R1 Distill (14B)",
    "category": "llm",
    "summary": "Deep reasoning at 14B. Chain-of-thought reasoning. Largely superseded by Qwen 3 14B and Phi-4 Reasoning for most tasks.",
    "tasks": [
      "reasoning",
      "chat",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/deepseek-r1-14b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-small-24b",
    "name": "Mistral Small (24B)",
    "category": "llm",
    "summary": "Mistral's refined 24B model. Excellent for nuanced conversations and professional writing.",
    "tasks": [
      "chat",
      "general",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 18,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/mistral-small-24b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "muse-glimmer-30b",
    "name": "Muse Glimmer 30B",
    "category": "llm",
    "summary": "Meta Superintelligence Lab local agent model with text+image input, 131K context, Apache 2.0 weights and official GGUF/ExecuTorch artifacts. The K-Quant 17GB build targets 24GB machines; 32GB is safer for vision and long-context sessions.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agentic",
      "vision",
      "long-context",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 20,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-08-09",
    "path": "/models/muse-glimmer-30b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm4.7",
    "name": "GLM 4.7",
    "category": "llm",
    "summary": "Z.ai open-weight flagship MoE with 355B total parameters and 32B active per token. The verified Q4_K_M GGUF is roughly 216.5 GB, so local use requires a 256 GB workstation class. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 256,
    "min_vram_gb": 247,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/glm4.7",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "minimax-m2.1",
    "name": "MiniMax M2.1",
    "category": "llm",
    "summary": "MiniMax open-weight agentic MoE with about 230B total parameters and about 10B active per token. The verified Q4_K_M GGUF is roughly 138.3 GB, requiring a 192 GB workstation class. Modified MIT licence.",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 192,
    "min_vram_gb": 158,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/minimax-m2.1",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-32b",
    "name": "Qwen 3 (32B)",
    "category": "llm",
    "summary": "Near GPT-4 intelligence locally. Thinking mode demolishes hard problems. The local AI dream.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/qwen3-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma3-27b",
    "name": "Gemma 3 (27B)",
    "category": "llm",
    "summary": "Google's flagship multimodal. Image + text understanding at an exceptional level.",
    "tasks": [
      "chat",
      "vision",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 20,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/gemma3-27b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-32b",
    "name": "DeepSeek R1 Distill (32B)",
    "category": "llm",
    "summary": "Solid reasoning at 32B but outclassed by GLM-4 32B and Qwen 3 32B for general use. Still good for pure math/logic.",
    "tasks": [
      "reasoning",
      "chat",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/deepseek-r1-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.3-70b",
    "name": "Llama 3.3 (70B)",
    "category": "llm",
    "summary": "Meta's 70B workhorse. Good finetune ecosystem. Outperformed by GLM 4.5 Air and DeepSeek V3.2 for raw quality.",
    "tasks": [
      "chat",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-12",
    "path": "/models/llama3.3-70b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v3.2",
    "name": "DeepSeek V3.2 (37B/671B MoE)",
    "category": "llm",
    "summary": "DeepSeek's massive MoE flagship. 37B active out of 671B total. Exceptional coding, reasoning and general capabilities. Ranks #6 on global usage leaderboards with 29B monthly tokens. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 46,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/deepseek-v3.2",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "trinity-large",
    "name": "Trinity Large Preview (70B MoE)",
    "category": "llm",
    "summary": "Arcee AI's massive MoE open model. ~400B total parameters, 70B active per forward pass. Ranks near the top of global usage leaderboards. Exceptional versatility across reasoning, coding and chat. Free and open-source. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 52,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/trinity-large",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "kimi-k2.5-32b",
    "name": "Kimi K2.5 (1T MoE)",
    "category": "llm",
    "summary": "Moonshot AI open-weight multimodal agentic MoE with 1T total parameters and 32B active per token. The verified Q4_K_M GGUF is roughly 621.2 GB, making this a server-grade local target. The legacy route ID keeps its active-parameter shorthand for URL stability. Modified MIT licence.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "server-grade",
      "quality",
      "moe",
      "multimodal"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 706,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-01",
    "path": "/models/kimi-k2.5-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "kimi-k2.7-code",
    "name": "Kimi K2.7 Code (1T MoE)",
    "category": "llm",
    "summary": "Moonshot AI coding-focused agentic Kimi built on K2.6. 1T MoE with 32B active parameters, 256K context, MoonViT vision encoder and stronger long-horizon coding while reducing thinking-token usage by roughly 30% vs K2.6. Modified MIT. Server-grade only.",
    "tasks": [
      "code",
      "reasoning",
      "agentic",
      "multimodal",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 677,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/kimi-k2.7-code",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm4-9b",
    "name": "GLM-4 (9B)",
    "category": "llm",
    "summary": "Zhipu AI's efficient all-rounder. Strong bilingual performance (CN/EN). Model License (research/personal use; commercial contact Zhipu).",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 10,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-06",
    "path": "/models/glm4-9b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm4-32b",
    "name": "GLM-4 (32B)",
    "category": "llm",
    "summary": "Flagship GLM-4. Much better than QwQ 32B for general tasks. Llama-70B class performance at half the size. Exceptional bilingual (CN/EN).",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-08",
    "path": "/models/glm4-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-235b-a22b",
    "name": "Qwen 3 MoE (235B/22B active)",
    "category": "llm",
    "summary": "Mixture of Experts behemoth. Only 22B params active at once = fast despite massive size. Top-tier.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 91,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/qwen3-235b-a22b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "command-r-plus",
    "name": "Command R+ (104B)",
    "category": "llm",
    "summary": "Cohere's flagship open model. CC BY-NC 4.0 license (non-commercial; commercial license available). Unmatched 128K context. Perfect for RAG.",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 72,
    "min_vram_gb": 74,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/command-r-plus",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "wizardlm2-8x22b",
    "name": "WizardLM 2 (8x22B)",
    "category": "llm",
    "summary": "Microsoft AI's ultra-popular fine-tune of Mixtral 8x22B. Apache 2.0 license. Exceptional instruction following and conversational quality.",
    "tasks": [
      "chat",
      "code",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 100,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-04",
    "path": "/models/wizardlm2-8x22b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-35b-a3b",
    "name": "Qwen 3.5 MoE (35B/3B active)",
    "category": "llm",
    "summary": "MoE gem - only 3B params active at inference. 19x faster than Qwen3-Max at 256K context. Best quality-per-watt of the series. Hybrid thinking mode. Runs on Mac Studio 32GB. Agentic coding standout.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 23,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/qwen3.5-35b-a3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-27b",
    "name": "Qwen 3.5 (27B)",
    "category": "llm",
    "summary": "Dense 27B powerhouse. Hybrid thinking/non-thinking mode. Strong multilingual (29+ languages). 256K context window. Excellent instruction-following and math. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 20,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/qwen3.5-27b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-122b-a10b",
    "name": "Qwen 3.5 MoE (122B/10B active)",
    "category": "llm",
    "summary": "Large MoE model with only 10B active params. 60% cheaper to run than Qwen3-Max. 256K context. Top-tier reasoning, coding and multilingual. Hybrid think/non-think. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 80,
    "min_vram_gb": 74,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/qwen3.5-122b-a10b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-397b-a17b",
    "name": "Qwen 3.5 MoE (397B/17B active)",
    "category": "llm",
    "summary": "Flagship open-source Qwen 3.5. Only 17B active params despite 397B total - world-class quality at MoE efficiency. Matches GPT-4o on major benchmarks. Requires multi-GPU or server-grade hardware. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 256,
    "min_vram_gb": 228,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/qwen3.5-397b-a17b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-0.8b",
    "name": "Qwen 3.5 (0.8B)",
    "category": "llm",
    "summary": "The tiniest Qwen 3.5 - runs on any device including smartphones and Raspberry Pi. Hybrid thinking mode, 256K context, Apache 2.0. Perfect for on-device AI and embedded apps.",
    "tasks": [
      "chat",
      "code",
      "edge",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 2,
    "min_vram_gb": 1,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/qwen3.5-0.8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-2b",
    "name": "Qwen 3.5 (2B)",
    "category": "llm",
    "summary": "Ultra-compact Qwen 3.5 with hybrid thinking mode and 256K context. Runs comfortably on 4 GB RAM - ideal for MacBook Air M1/M2, Windows laptops, and edge devices. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "edge",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/qwen3.5-2b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-4b",
    "name": "Qwen 3.5 (4B)",
    "category": "llm",
    "summary": "Sweet-spot small model. Surprisingly capable for its size with hybrid thinking, 256K context and strong multilingual support. Runs on 8 GB RAM. The go-to for MacBook Air M4 16 GB. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "speed",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/qwen3.5-4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.5-9b",
    "name": "Qwen 3.5 (9B)",
    "category": "llm",
    "summary": "The best small Qwen 3.5 for everyday use. Strong reasoning, coding and chat at 9B scale with hybrid thinking mode and 256K context. Runs on 8-16 GB RAM. Great for Mac Mini M4 Pro. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/qwen3.5-9b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.6-6.7b",
    "name": "Qwen 3.6 (6.7B)",
    "category": "llm",
    "summary": "Alibaba's hybrid-thinking micro-flagship. Toggles between instant answers and deep chain-of-thought reasoning on demand. 128K context, 29 languages, outperforms Qwen3-8B on reasoning benchmarks. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "speed",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-04",
    "path": "/models/qwen3.6-6.7b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.6-27b",
    "name": "Qwen 3.6 (27B)",
    "category": "llm",
    "summary": "Qwen 3.6 flagship dense model. Hybrid thinking mode with /think toggle for deep chain-of-thought reasoning. 128K context, 29+ languages. Significantly outperforms Qwen3.5-27B on reasoning, coding & math. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 20,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-04",
    "path": "/models/qwen3.6-27b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.6-35b-a3b",
    "name": "Qwen 3.6 35B-A3B",
    "category": "llm",
    "summary": "Qwen Team open-weight MoE for agentic coding and multimodal work. 35B total / 3B active, 262K native context, Apache 2.0, and strong GGUF availability through Unsloth and LM Studio-compatible artifacts.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "vision",
      "agentic",
      "power",
      "long-context"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-04",
    "path": "/models/qwen3.6-35b-a3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.8-27b",
    "name": "Qwen3.8-27B",
    "category": "llm",
    "summary": "Official Qwen dense 27B vision-language release with Apache 2.0 weights, 262K native context, thinking controls and strong agentic coding benchmarks. Practical local path through Unsloth and LM Studio-compatible GGUF artifacts.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "vision",
      "agentic",
      "power",
      "long-context"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 20,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-08-05",
    "path": "/models/qwen3.8-27b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3.7-max-preview",
    "name": "Qwen 3.7 Max Preview",
    "category": "llm",
    "summary": "Alibaba Cloud flagship preview announced in May 2026. Built for agentic coding, complex reasoning and long-horizon task execution. Proprietary/API-only for now - not an open-weight GGUF model for local LM Studio use.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "api"
    ],
    "platforms": [],
    "accelerators": [],
    "min_ram_gb": 0,
    "min_vram_gb": 0,
    "runtime": [
      "API"
    ],
    "license": "See model card",
    "local_status": "api",
    "released": "2026-05",
    "path": "/models/qwen3.7-max-preview",
    "resource_basis": "API only"
  },
  {
    "id": "gemma3n-8b",
    "name": "Gemma 3n (8B)",
    "category": "llm",
    "summary": "Google on-device powerhouse with vision. Designed for phones/tablets/laptops but punches far above its weight. Per-layer memory management for constrained devices. Apache 2.0.",
    "tasks": [
      "chat",
      "vision",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-06",
    "path": "/models/gemma3n-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma4-e2b",
    "name": "Gemma 4 E2B",
    "category": "llm",
    "summary": "Gemma 4 compact multimodal model for on-device usage. Supports text, image, audio, and video understanding with 256K context. Apache 2.0.",
    "tasks": [
      "chat",
      "vision",
      "speed",
      "edge",
      "multimodal",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 4,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/gemma4-e2b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma4-e4b",
    "name": "Gemma 4 E4B",
    "category": "llm",
    "summary": "Gemma 4 balanced edge model with strong multimodal quality and 256K context. Great for laptops and high-end mobile devices. Apache 2.0.",
    "tasks": [
      "chat",
      "vision",
      "standard",
      "multimodal",
      "reasoning",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/gemma4-e4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma4-26b-a4b",
    "name": "Gemma 4 26B A4B",
    "category": "llm",
    "summary": "Gemma 4 MoE flagship-for-workstations: 26B total with ~4B active parameters. 256K context and excellent quality-per-watt for local inference. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "multimodal",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 19,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/gemma4-26b-a4b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "gemma4-31b",
    "name": "Gemma 4 31B",
    "category": "llm",
    "summary": "Largest Gemma 4 model for premium local quality. Strong coding and reasoning with 256K context and broad multilingual support. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "multimodal",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/gemma4-31b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-0528",
    "name": "DeepSeek R1 0528 (671B MoE)",
    "category": "llm",
    "summary": "Updated flagship DeepSeek R1 with improved reasoning chains and fewer hallucinations. Major upgrade to chain-of-thought quality. MIT licensed. Server-grade only.",
    "tasks": [
      "reasoning",
      "code",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 512,
    "min_vram_gb": 410,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-05",
    "path": "/models/deepseek-r1-0528",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama3.2-vision-90b",
    "name": "Llama 3.2 Vision (90B)",
    "category": "llm",
    "summary": "Meta's largest vision model. 128K context with powerful image reasoning and analysis. Requires significant hardware.",
    "tasks": [
      "vision",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 72,
    "min_vram_gb": 63,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-09",
    "path": "/models/llama3.2-vision-90b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-coder-30b",
    "name": "Qwen 3 Coder (30B)",
    "category": "llm",
    "summary": "Qwen flagship coding model. Designed for agentic coding with 256K context. Outperforms Claude 3.5 Sonnet on SWE-bench. Apache 2.0.",
    "tasks": [
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/qwen3-coder-30b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen2.5-vl-72b",
    "name": "Qwen 2.5 VL (72B)",
    "category": "llm",
    "summary": "Qwen massive vision-language model. Exceptional image and video understanding at 72B scale. 72K context.",
    "tasks": [
      "vision",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-01",
    "path": "/models/qwen2.5-vl-72b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "internvl3-8b",
    "name": "InternVL3 (8B)",
    "category": "llm",
    "summary": "Shanghai AI Lab multimodal model. Strong vision understanding for documents, charts, and photos. MIT licensed. Note: primarily PyTorch/safetensors - community GGUF may vary.",
    "tasks": [
      "vision",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/internvl3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-30b-a3b",
    "name": "Qwen 3 MoE (30B/3B active)",
    "category": "llm",
    "summary": "Efficient MoE model with only 3B active params. Fast inference at large model quality. Hybrid thinking mode. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "speed"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/qwen3-30b-a3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-r1-0528-qwen3-8b",
    "name": "DeepSeek R1 0528 Distill (8B)",
    "category": "llm",
    "summary": "Updated R1 reasoning distilled to Qwen3-8B. Improved chain-of-thought with fewer hallucinations vs original R1 distills. MIT licensed.",
    "tasks": [
      "reasoning",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-05",
    "path": "/models/deepseek-r1-0528-qwen3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "olmo2-32b",
    "name": "OLMo 2 (32B)",
    "category": "llm",
    "summary": "Allen AI fully open 32B model. Weights, data, training code all public. Strong general purpose at 32B. Apache 2.0.",
    "tasks": [
      "chat",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/olmo2-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mirothinker-30b",
    "name": "MiroThinker v1.5 (30B MoE)",
    "category": "llm",
    "summary": "⚠️ Despite the small active count, this is a full 30B MoE model (Qwen3-30B-A3B base). ~82 GB full weights (Q4_K_M ≈18 GB). Deep-research agent with 256K context, tool calls, multilingual (EN/ZH). Requires H100 80 GB or serious multi-GPU. Not suitable for M1/M2 or consumer GPUs. Apache 2.0.",
    "tasks": [
      "reasoning",
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-02",
    "path": "/models/mirothinker-30b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mirothinker-1.7",
    "name": "MiroThinker 1.7 (30B MoE)",
    "category": "llm",
    "summary": "MiroMind AI second-gen deep-research agent. 30B MoE with stronger tool-use, 256K context, SOTA on BrowseComp-ZH (Chinese research). Designed for agentic workflows, not casual chat. Released March 2026. Apache 2.0.",
    "tasks": [
      "reasoning",
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/mirothinker-1.7",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mirothinker-1.7-mini",
    "name": "MiroThinker 1.7 Mini (30B MoE)",
    "category": "llm",
    "summary": "⚠️ Despite the \"Mini\" name, this is a full 30B MoE model (Qwen3-30B-A3B). 3B = active params per forward pass, NOT model size. ~82 GB full weights. Requires H100 80GB or multi-GPU. 256K context, multilingual (EN/ZH+), deep-research agent with tool calls. Released 11 Mar 2026. Apache 2.0.",
    "tasks": [
      "reasoning",
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 21,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-03",
    "path": "/models/mirothinker-1.7-mini",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nemotron3-49b",
    "name": "Llama-3.3-Nemotron-Super (49B)",
    "category": "llm",
    "summary": "NVIDIA's super-efficient 49B distilled from DeepSeek-R1 + Llama. Outperforms Llama-3.3-70B at half the compute. Strong reasoning, coding & instruction following. Runs on Mac Studio 64GB. NVIDIA Open Model License.",
    "tasks": [
      "chat",
      "reasoning",
      "code",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 40,
    "min_vram_gb": 35,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-02",
    "path": "/models/nemotron3-49b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nemotron3-70b",
    "name": "Llama-3.1-Nemotron (70B)",
    "category": "llm",
    "summary": "NVIDIA fine-tune of Llama 3.1 70B. Best-in-class instruction following and alignment. Ranked #1 on MT-Bench at release. Exceptional helpfulness and safety. Compatible with Mac (Apple Silicon 64GB). NVIDIA Open Model License.",
    "tasks": [
      "chat",
      "reasoning",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-11",
    "path": "/models/nemotron3-70b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-vl-8b",
    "name": "Qwen 3 VL (8B)",
    "category": "llm",
    "summary": "Qwen 3 vision-language model. Strong OCR, document understanding, chart & UI reasoning. 128K context with native image+video inputs. Apache 2.0.",
    "tasks": [
      "vision",
      "chat",
      "multimodal",
      "standard"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-11",
    "path": "/models/qwen3-vl-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-vl-32b",
    "name": "Qwen 3 VL (32B)",
    "category": "llm",
    "summary": "Qwen 3 VL flagship open vision model. Competes with GPT-4o on MMMU, chart-QA and document reasoning. Native video understanding up to 1 hour. Apache 2.0.",
    "tasks": [
      "vision",
      "chat",
      "multimodal",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/qwen3-vl-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama4-scout-17b-16e",
    "name": "Llama 4 Scout (17B/109B MoE)",
    "category": "llm",
    "summary": "Meta Llama 4 Scout - natively multimodal MoE with 16 experts. 10M-token context window. Outperforms Gemma 3 and Mistral Small on most benchmarks at similar active cost. Llama 4 Community License.",
    "tasks": [
      "chat",
      "vision",
      "reasoning",
      "multimodal",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 74,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/llama4-scout-17b-16e",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "llama4-maverick-17b-128e",
    "name": "Llama 4 Maverick (17B/400B MoE)",
    "category": "llm",
    "summary": "Meta Llama 4 Maverick - 128-expert MoE flagship. Matches or beats GPT-4o and Gemini 2.0 Flash on reasoning, coding and multimodal benchmarks. 1M-token context. Server-grade hardware only. Llama 4 Community License.",
    "tasks": [
      "chat",
      "vision",
      "reasoning",
      "multimodal",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 384,
    "min_vram_gb": 273,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-04",
    "path": "/models/llama4-maverick-17b-128e",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm4.6-air",
    "name": "GLM 4.6 Air (12B)",
    "category": "llm",
    "summary": "Zhipu AI lightweight flagship. Strong bilingual CN/EN with hybrid thinking mode, 200K context and tool calling. Apache 2.0 - excellent alternative to Qwen 3.5 9B on modest GPUs.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 9,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-02",
    "path": "/models/glm4.6-air",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite3.3-8b",
    "name": "Granite 3.3 (8B Instruct)",
    "category": "llm",
    "summary": "IBM enterprise-grade 8B. Trained for RAG, tool-use and structured output. Strong function calling and long-context performance (128K). Apache 2.0 with full data provenance.",
    "tasks": [
      "chat",
      "code",
      "standard",
      "general",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 6,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-10",
    "path": "/models/granite3.3-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "granite3.3-2b",
    "name": "Granite 3.3 (2B Instruct)",
    "category": "llm",
    "summary": "IBM ultra-efficient 2B. Best-in-class among small models for tool calling & structured output. Perfect for on-device RAG and agents. 128K context. Apache 2.0.",
    "tasks": [
      "chat",
      "light",
      "edge",
      "speed",
      "code"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 2,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-10",
    "path": "/models/granite3.3-2b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "hermes4-70b",
    "name": "Hermes 4 (70B)",
    "category": "llm",
    "summary": "Nous Research fine-tune with hybrid reasoning mode. Built on Llama 3.1 70B, aligned for steerability and neutral stance. Top-tier open RP/agent model. Llama 3.1 Community License.",
    "tasks": [
      "chat",
      "reasoning",
      "power",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 48,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/hermes4-70b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "hermes4-405b",
    "name": "Hermes 4 (405B)",
    "category": "llm",
    "summary": "Nous Research flagship 405B with hybrid thinking. Matches Claude 3.5 Sonnet and GPT-4o on reasoning benchmarks. Server-grade hardware only. Llama 3.1 Community License.",
    "tasks": [
      "chat",
      "reasoning",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 384,
    "min_vram_gb": 262,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/hermes4-405b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "command-a-111b",
    "name": "Command A (111B)",
    "category": "llm",
    "summary": "Cohere open-weight flagship optimised for agentic workflows and long-context RAG. 256K context, excellent multilingual coverage (23 languages). CC-BY-NC 4.0 - non-commercial.",
    "tasks": [
      "chat",
      "reasoning",
      "quality",
      "general",
      "power"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 96,
    "min_vram_gb": 78,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-03",
    "path": "/models/command-a-111b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "aya-expanse-32b",
    "name": "Aya Expanse (32B)",
    "category": "llm",
    "summary": "Cohere's multilingual powerhouse - 23 languages including Arabic, Hindi, Japanese, Polish. State-of-the-art on multilingual benchmarks at 32B scale. CC-BY-NC 4.0.",
    "tasks": [
      "chat",
      "multilingual",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 22,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2024-10",
    "path": "/models/aya-expanse-32b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "kimi-k2-instruct",
    "name": "Kimi K2 Instruct (1T MoE)",
    "category": "llm",
    "summary": "Moonshot AI trillion-parameter MoE flagship. 32B active params per token with 384 experts. Matches or beats GPT-4 Turbo on MMLU, GSM8K, HumanEval. Agentic & tool-use specialist. Server-grade only. Modified MIT.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 682,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-07",
    "path": "/models/kimi-k2-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "kimi-k2-thinking",
    "name": "Kimi K2 Thinking (1T MoE)",
    "category": "llm",
    "summary": "Moonshot AI K2 with extended reasoning mode. Chain-of-thought traces before final answer. Top-5 on GPQA, AIME, SWE-bench. Requires datacenter-grade hardware or distributed inference. Modified MIT.",
    "tasks": [
      "reasoning",
      "code",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 682,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-11",
    "path": "/models/kimi-k2-thinking",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "kimi-linear-48b-a3b-instruct",
    "name": "Kimi Linear 48B-A3B Instruct",
    "category": "llm",
    "summary": "Moonshot AI efficient Kimi model with linear-attention style architecture and 3B active parameters. Strong long-context, reasoning and coding signal. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "moe",
      "long-context"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 48,
    "min_vram_gb": 32,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-12",
    "path": "/models/kimi-linear-48b-a3b-instruct",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v4-pro",
    "name": "DeepSeek V4 Pro (1.6T MoE)",
    "category": "llm",
    "summary": "DeepSeek frontier MoE with 1M-token context, hybrid compressed attention and top-tier coding/reasoning. MIT licensed. Datacenter-grade only.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "long-context",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 966,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/deepseek-v4-pro",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v4-flash",
    "name": "DeepSeek V4 Flash (284B MoE)",
    "category": "llm",
    "summary": "Efficient DeepSeek V4 variant: 284B total, 13B active, 1M-token context. Flash-Max can approach Pro reasoning with larger thinking budget. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "agentic",
      "long-context",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 256,
    "min_vram_gb": 194,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/deepseek-v4-flash",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v4-flash-0731",
    "name": "DeepSeek V4 Flash 0731 (284B MoE)",
    "category": "llm",
    "summary": "Official MIT DeepSeek V4 Flash successor release with stronger agentic coding, DSpark speculative decoding support and a practical Unsloth Dynamic GGUF path. Still a large workstation/server local model: Q4 is about 155GB and Q8 is about 162GB.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "long-context",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 256,
    "min_vram_gb": 177,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-07-31",
    "path": "/models/deepseek-v4-flash-0731",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm-5.1",
    "name": "GLM-5.1",
    "category": "llm",
    "summary": "Z.ai next-generation flagship for agentic engineering. Stronger coding, long-horizon tool use, SWE-Bench Pro, Terminal-Bench and repo generation. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 640,
    "min_vram_gb": 489,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/glm-5.1",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm-5.2",
    "name": "GLM-5.2 (744B MoE)",
    "category": "llm",
    "summary": "Z.ai flagship open model for long-horizon coding, reasoning and agentic work. 744B total, 40B active, 1M-token context, MIT license. Unsloth Dynamic GGUF makes it technically local, but it needs workstation/server-class memory: ~245GB total memory for 2-bit and 372GB+ for 4-bit.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "long-context",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 256,
    "min_vram_gb": 272,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/glm-5.2",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ornith-1.0-9b-gguf",
    "name": "Ornith 1.0 9B GGUF",
    "category": "llm",
    "summary": "Compact Ornith 1.0 GGUF variant from DeepReinforce for agentic coding experiments on consumer hardware. MIT licensed and much more practical than the frontier 397B release.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "speed",
      "agentic",
      "tool-calling",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/ornith-1.0-9b-gguf",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ornith-1.0-35b-gguf",
    "name": "Ornith 1.0 35B GGUF",
    "category": "llm",
    "summary": "DeepReinforce Ornith 1.0 mid-size GGUF release for agentic coding. The Q4_K_M build is listed around 21.2GB, making it a realistic 32GB+ local model compared with the 397B server-grade version.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "tool-calling",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 25,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/ornith-1.0-35b-gguf",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ornith-1.0-397b",
    "name": "Ornith 1.0 (397B MoE)",
    "category": "llm",
    "summary": "DeepReinforce MIT-licensed open-weight MoE derived from DeepSeek-V3.1-Terminus, tuned for agentic tool use, coding and reasoning. Official local serving examples target vLLM/SGLang on 8x80GB GPU nodes, so this is server-grade only.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "tool-calling",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 640,
    "min_vram_gb": 910,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/ornith-1.0-397b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mimo-v2.5-pro",
    "name": "MiMo-V2.5-Pro (1.02T MoE)",
    "category": "llm",
    "summary": "Xiaomi MiMo flagship MoE for demanding agentic, software engineering and long-horizon tasks. 1M-token context, FP8, strong instruction following. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "agentic",
      "long-context",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 682,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/mimo-v2.5-pro",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "deepseek-v3.2-exp",
    "name": "DeepSeek V3.2 Exp (671B MoE)",
    "category": "llm",
    "summary": "Experimental V3.2 with DeepSeek Sparse Attention (DSA) - halves inference cost vs V3.1 on long context while keeping quality. 128K context, improved coding & tool-use. MIT licensed. Server-grade.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 512,
    "min_vram_gb": 432,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/deepseek-v3.2-exp",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "mistral-small-3.2-24b",
    "name": "Mistral Small 3.2 (24B)",
    "category": "llm",
    "summary": "Mistral AI's latest dense 24B. Improved instruction following, function calling, and reduced repetition. Strong European-language support. 128K context. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "power",
      "general",
      "reasoning"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 16,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-06",
    "path": "/models/mistral-small-3.2-24b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-next-80b-a3b",
    "name": "Qwen 3 Next (80B/3B MoE)",
    "category": "llm",
    "summary": "Alibaba's next-gen MoE with hybrid-gated DeltaNet attention. Only 3B active params - runs at dense 7B speed with 70B quality. 256K native context (extensible to 1M). Hybrid thinking mode. Apache 2.0.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "power",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 55,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/qwen3-next-80b-a3b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "glm-4.6-355b",
    "name": "GLM 4.6 (355B MoE)",
    "category": "llm",
    "summary": "Zhipu AI flagship - full GLM 4.6. 200K context, strong tool-calling & agentic workflows. Competes with Claude 3.5 Sonnet on reasoning and code. MIT licensed. Server-grade hardware.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 320,
    "min_vram_gb": 228,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-09",
    "path": "/models/glm-4.6-355b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "minimax-m2-230b",
    "name": "MiniMax M2 (230B MoE)",
    "category": "llm",
    "summary": "MiniMax MoE flagship with 10B active params and 4M-token long-context. Specialised for agentic coding and tool-use. Competitive with GPT-4 class models at a fraction of the inference cost. MIT licensed.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 192,
    "min_vram_gb": 160,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-10",
    "path": "/models/minimax-m2-230b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "minimax-m3",
    "name": "MiniMax M3 (428B/23B active)",
    "category": "llm",
    "summary": "MiniMax native multimodal MoE with 1M context and MiniMax Sparse Attention. Around 428B parameters with 23B active. Built for long-context coding, cowork and agentic workflows, with local deployment via SGLang, vLLM or Transformers. Server-grade only.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "agentic",
      "long-context",
      "multimodal",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 2048,
    "min_vram_gb": 1932,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-06",
    "path": "/models/minimax-m3",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ling-1t",
    "name": "Ling 1T (1T MoE)",
    "category": "llm",
    "summary": "Ant Group / InclusionAI trillion-param MoE. 50B active per token, 128K context. Strong Chinese + English, open weights with commercial licence. Tops many bilingual benchmarks. Datacenter-only.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 1024,
    "min_vram_gb": 705,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-10",
    "path": "/models/ling-1t",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "ling-2.6-flash",
    "name": "Ling-2.6-flash (104B MoE)",
    "category": "llm",
    "summary": "InclusionAI's MIT-licensed instruct MoE optimized for fast agent workloads. 104B total parameters, only 7.4B active, hybrid linear attention, 262K context and strong tool-use / multi-step execution with high token efficiency.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "speed",
      "quality"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 80,
    "min_vram_gb": 74,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-04",
    "path": "/models/ling-2.6-flash",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "dante-mosaic-3.5b",
    "name": "DANTE-Mosaic-3.5B",
    "category": "llm",
    "summary": "OdaxAI compact dense model based on SmolLM3-3B and distilled from Kimi K2. Strong small-model benchmark profile: GSM8K 74.45, HellaSwag 76.73 and MBPP 42.6. Apache 2.0, BF16 weights, practical for local Transformers/vLLM use.",
    "tasks": [
      "chat",
      "reasoning",
      "code",
      "light",
      "multilingual"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 8,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/dante-mosaic-3.5b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "zaya1-8b",
    "name": "ZAYA1-8B",
    "category": "llm",
    "summary": "Zyphra's Apache-2.0 reasoning MoE: 8.4B total parameters with only ~760M active, 16 experts, 131K context, Compressed Convolutional Attention and strong math/code benchmarks. Experimental for local use today: currently needs Zyphra vLLM/Transformers forks; LM Studio/GGUF/MLX support is not yet verified.",
    "tasks": [
      "chat",
      "code",
      "reasoning",
      "math",
      "experimental"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 20,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2026-05",
    "path": "/models/zaya1-8b",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "nemotron-nano-9b-v2",
    "name": "Nemotron Nano 9B v2",
    "category": "llm",
    "summary": "NVIDIA hybrid Mamba-Transformer 9B. 6x throughput vs comparable dense models, 128K context, strong maths/code. Efficient toggle-able reasoning. NVIDIA Open Model License.",
    "tasks": [
      "chat",
      "reasoning",
      "code",
      "standard",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 10,
    "min_vram_gb": 7,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-08",
    "path": "/models/nemotron-nano-9b-v2",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "apriel-nemotron-15b-thinker",
    "name": "Apriel Nemotron 15B Thinker",
    "category": "llm",
    "summary": "ServiceNow x NVIDIA mid-size reasoner. Half the memory of 32B reasoners with comparable performance on MBPP, BFCL, GPQA. Strong enterprise fit. MIT licensed.",
    "tasks": [
      "reasoning",
      "code",
      "power",
      "general"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 11,
    "runtime": [
      "GGUF / local runtime"
    ],
    "license": "See model card",
    "local_status": "local",
    "released": "2025-05",
    "path": "/models/apriel-nemotron-15b-thinker",
    "resource_basis": "catalogue RAM floor"
  },
  {
    "id": "qwen3-tts",
    "name": "Qwen3-TTS (0.6B / 1.7B)",
    "category": "voice",
    "summary": "Qwen Team's open-source 0.6B and 1.7B TTS series for streaming speech, voice design and short-reference voice cloning across 10 documented languages.",
    "tasks": [
      "streaming",
      "realtime",
      "multilingual",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 7,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache-2.0",
    "local_status": "local",
    "released": "2026-01-22",
    "path": "/tts/qwen3-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "melotts",
    "name": "MeloTTS",
    "category": "voice",
    "summary": "High-quality multilingual TTS with extremely natural voice cloning. Best for Chinese and English with fast inference.",
    "tasks": [
      "cloning",
      "realtime",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-03",
    "path": "/tts/melotts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "piper",
    "name": "Piper",
    "category": "voice",
    "summary": "Fast, local neural TTS optimized for Raspberry Pi and edge devices. Lightweight with good quality for embedded systems.",
    "tasks": [
      "realtime",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 0,
    "runtime": [
      "Onnx"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2023-06",
    "path": "/tts/piper",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "coqui-tts",
    "name": "Coqui TTS (XTTS v2)",
    "category": "voice",
    "summary": "The most popular open TTS with incredible voice cloning from just 6 seconds of audio. Discontinued but widely used.",
    "tasks": [
      "cloning",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 5,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "CPML (custom)",
    "local_status": "local",
    "released": "2023-09",
    "path": "/tts/coqui-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "bark",
    "name": "Bark (Suno)",
    "category": "voice",
    "summary": "Generative TTS that can produce highly expressive speech, music, and sound effects. Very creative but slower.",
    "tasks": [
      "multilingual",
      "music",
      "sfx",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 11,
    "min_vram_gb": 6,
    "runtime": [
      "Pytorch"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2023-04",
    "path": "/tts/bark",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "mms",
    "name": "MMS (Meta)",
    "category": "voice",
    "summary": "Massively Multilingual Speech by Meta. Supports 1100+ languages, the most comprehensive language coverage available.",
    "tasks": [
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "CC-BY-NC 4.0",
    "local_status": "local",
    "released": "2023-05",
    "path": "/tts/mms",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "parler-tts",
    "name": "Parler TTS",
    "category": "voice",
    "summary": "High-quality controllable TTS trained on 10k+ hours of audiobooks. Natural prosody and speaker control via prompts.",
    "tasks": [
      "realtime",
      "controllable",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 7,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-02",
    "path": "/tts/parler-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "fish-speech",
    "name": "Fish Speech",
    "category": "voice",
    "summary": "Fast, high-quality TTS with voice cloning and multilingual support. Optimized for real-time applications.",
    "tasks": [
      "streaming",
      "realtime",
      "cloning",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-06",
    "path": "/tts/fish-speech",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "edge-tts",
    "name": "Edge TTS",
    "category": "voice",
    "summary": "Python interface to Microsoft Edge's online TTS service. Internet access is required for synthesis; no local speech checkpoint is provided.",
    "tasks": [
      "realtime",
      "multilingual",
      "tts"
    ],
    "platforms": [],
    "accelerators": [],
    "min_ram_gb": 0,
    "min_vram_gb": 0,
    "runtime": [
      "Mp3",
      "Webm"
    ],
    "license": "GPL-3.0",
    "local_status": "api",
    "released": "2022-08",
    "path": "/tts/edge-tts",
    "resource_basis": "API only"
  },
  {
    "id": "styletts2",
    "name": "StyleTTS 2",
    "category": "voice",
    "summary": "Style-based TTS with high naturalness and style diffusion. Academic research model with excellent quality.",
    "tasks": [
      "controllable",
      "cloning",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 5,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-01",
    "path": "/tts/styletts2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "f5-tts",
    "name": "F5-TTS",
    "category": "voice",
    "summary": "Flow-matching based TTS with SOTA quality and extremely fast inference. Simple and efficient architecture.",
    "tasks": [
      "realtime",
      "cloning",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "CC-BY-NC-4.0 weights; MIT code",
    "local_status": "local",
    "released": "2024-10",
    "path": "/tts/f5-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "chattts",
    "name": "ChatTTS",
    "category": "voice",
    "summary": "Conversational TTS optimized for dialogue with natural turn-taking and emotion. Great for chatbots.",
    "tasks": [
      "streaming",
      "emotion",
      "dialogue",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch"
    ],
    "license": "AGPL-3.0",
    "local_status": "local",
    "released": "2024-05",
    "path": "/tts/chattts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "tortoise-tts",
    "name": "Tortoise TTS",
    "category": "voice",
    "summary": "Quality-focused TTS with impressive voice cloning. Slower but produces very natural speech.",
    "tasks": [
      "cloning",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 7,
    "runtime": [
      "Pytorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2022-05",
    "path": "/tts/tortoise-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "metavoice",
    "name": "MetaVoice-1B",
    "category": "voice",
    "summary": "1B parameter TTS with zero-shot voice cloning. Large model for high-quality synthesis.",
    "tasks": [
      "cloning",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 10,
    "min_vram_gb": 6,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-03",
    "path": "/tts/metavoice",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "espeak-ng",
    "name": "eSpeak NG",
    "category": "voice",
    "summary": "Compact, fast rule-based TTS. Not neural but extremely lightweight and supports 100+ languages.",
    "tasks": [
      "realtime",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 0,
    "runtime": [
      "Native"
    ],
    "license": "GPL-3.0",
    "local_status": "local",
    "released": "2010-01",
    "path": "/tts/espeak-ng",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "kokoro",
    "name": "Kokoro TTS",
    "category": "voice",
    "summary": "Ultra-lightweight yet stunning quality. 82M params only - runs on CPU in real-time. Best quality-to-size ratio of any TTS model.",
    "tasks": [
      "realtime",
      "streaming",
      "low-latency",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-01",
    "path": "/tts/kokoro",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "orpheus-tts",
    "name": "Orpheus TTS",
    "category": "voice",
    "summary": "LLM-based TTS with human-level naturalness. Supports rich emotion tags (laugh, sigh, hesitation). Built on Llama 3 architecture for unprecedented expressiveness.",
    "tasks": [
      "emotion",
      "streaming",
      "cloning",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 9,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch",
      "Gguf"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-03",
    "path": "/tts/orpheus-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "chatterbox",
    "name": "Chatterbox TTS",
    "category": "voice",
    "summary": "Open-source SOTA voice cloning from Resemble AI. Outperforms ElevenLabs on naturalness benchmarks. Supports emotion exaggeration control and ultra-stable generation.",
    "tasks": [
      "cloning",
      "emotion",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-05",
    "path": "/tts/chatterbox",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "dia-tts",
    "name": "Dia",
    "category": "voice",
    "summary": "1.6B dialogue TTS - generates realistic two-speaker conversations from a single transcript. Supports non-verbal cues like [laughs], [coughs], [sighs] natively.",
    "tasks": [
      "dialogue",
      "emotion",
      "cloning",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-04",
    "path": "/tts/dia-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "outetts",
    "name": "OuteTTS",
    "category": "voice",
    "summary": "Pure language model approach to TTS - no separate audio encoder. Runs via llama.cpp for fully local GGUF inference. Excellent for CPU-only setups.",
    "tasks": [
      "realtime",
      "low-latency",
      "cloning",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Gguf",
      "Pytorch"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-01",
    "path": "/tts/outetts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "cosyvoice2",
    "name": "CosyVoice 2",
    "category": "voice",
    "summary": "Industrial-grade multilingual TTS with streaming, voice cloning and emotion control. Exceptional Chinese + English quality. Used in production at Alibaba scale.",
    "tasks": [
      "streaming",
      "realtime",
      "cloning",
      "emotion",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-12",
    "path": "/tts/cosyvoice2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "spark-tts",
    "name": "Spark TTS",
    "category": "voice",
    "summary": "Bilingual TTS with virtual speaker creation - control pitch, speed, gender from text. Built on Qwen2.5 LLM backbone for powerful generation.",
    "tasks": [
      "cloning",
      "streaming",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-03",
    "path": "/tts/spark-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "voicebox",
    "name": "Voicebox",
    "category": "voice",
    "summary": "Desktop app & orchestrator for local TTS - not a model. Provides a UI studio, voice profile management, and a local API. Generates audio via swappable backends (Qwen3 TTS, Kokoro, Piper, XTTS…). Think of it as a front-end shell that runs on top of your installed TTS models.",
    "tasks": [
      "streaming",
      "realtime",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Native App"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-02",
    "path": "/tts/voicebox",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "sesame-csm",
    "name": "Sesame CSM",
    "category": "voice",
    "summary": "Conversational Speech Model - generates speech with natural turn-taking, backchannels and interruptions. Built specifically for multi-turn dialogue with real-time response generation.",
    "tasks": [
      "dialogue",
      "streaming",
      "realtime",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 9,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-03",
    "path": "/tts/sesame-csm",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "gpt-sovits",
    "name": "GPT-SoVITS",
    "category": "voice",
    "summary": "Zero-shot voice cloning TTS combining GPT and SoVITS. Clone any voice from 5 seconds of audio. Extremely popular in the open-source community with 40K+ GitHub stars.",
    "tasks": [
      "cloning",
      "multilingual",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 5,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-01",
    "path": "/tts/gpt-sovits",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "emotivoice",
    "name": "EmotiVoice",
    "category": "voice",
    "summary": "Multi-voice TTS with granular emotion control. Choose from 2000+ built-in voices and specify emotions like happy, sad, angry, or surprised per sentence.",
    "tasks": [
      "emotion",
      "multilingual",
      "controllable",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2023-11",
    "path": "/tts/emotivoice",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "mars5",
    "name": "MARS5",
    "category": "voice",
    "summary": "AR-diffusion hybrid TTS with near-human quality. Ultra-fast zero-shot voice cloning from a few seconds of audio. Unique hybrid architecture combining autoregressive and diffusion.",
    "tasks": [
      "cloning",
      "streaming",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 7,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch"
    ],
    "license": "AGPL-3.0",
    "local_status": "local",
    "released": "2024-06",
    "path": "/tts/mars5",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "maskgct",
    "name": "MaskGCT",
    "category": "voice",
    "summary": "Fully non-autoregressive TTS - no text-phone alignment needed. Achieves human parity on naturalness and similarity metrics. Incredibly fast inference.",
    "tasks": [
      "cloning",
      "realtime",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 7,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-10",
    "path": "/tts/maskgct",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "indic-tts",
    "name": "IndicTTS",
    "category": "voice",
    "summary": "Multi-Indian language TTS supporting Hindi, Tamil, Telugu, Bengali, Marathi and more. High quality for Indian languages often underserved by other models. Built at IIT Madras.",
    "tasks": [
      "multilingual",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-02",
    "path": "/tts/indic-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "tada",
    "name": "TADA",
    "category": "voice",
    "summary": "LLM-based TTS built on Llama with a fully integrated audio tokenizer and decoder. Available in 1B (English) and 3B multilingual variants. Open-source weights on HuggingFace. Developed by Hume AI, specialists in expressive, emotion-aware voice.",
    "tasks": [
      "multilingual",
      "emotion",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 5,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-02",
    "path": "/tts/tada",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "kitten-tts",
    "name": "Kitten TTS v0.8",
    "category": "voice",
    "summary": "KittenML's 0.8 developer-preview TTS line for CPU and edge use, with 15M, 40M and 80M variants, eight built-in voices and 25–80 MB published footprints.",
    "tasks": [
      "realtime",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 0,
    "runtime": [
      "Onnx"
    ],
    "license": "Apache-2.0",
    "local_status": "local",
    "released": "2026-02-24",
    "path": "/tts/kitten-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "vibevoice-realtime-0.5b",
    "name": "VibeVoice Realtime 0.5B",
    "category": "voice",
    "summary": "Open-source real-time streaming TTS model focused on low first-token latency (~300ms) and robust long-form generation.",
    "tasks": [
      "streaming",
      "realtime",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-12",
    "path": "/tts/vibevoice-realtime-0.5b",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "vibevoice-1.5b",
    "name": "VibeVoice 1.5B",
    "category": "voice",
    "summary": "Open-source long-form multi-speaker TTS model (up to 90 min, up to 4 speakers). Listed as research-first with responsible-use constraints.",
    "tasks": [
      "streaming",
      "dialogue",
      "multilingual",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 15,
    "min_vram_gb": 9,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-08",
    "path": "/tts/vibevoice-1.5b",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "vibevoice-asr",
    "name": "VibeVoice ASR",
    "category": "voice",
    "summary": "Open-source multilingual ASR model (speech-to-text), supporting long-form transcription, timestamps, diarization and hotwords.",
    "tasks": [
      "streaming",
      "realtime",
      "multilingual",
      "dialogue",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 35,
    "min_vram_gb": 20,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2026-01",
    "path": "/tts/vibevoice-asr",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "cohere-transcribe-03-2026",
    "name": "Cohere Transcribe 03-2026",
    "category": "voice",
    "summary": "Open-weights Conformer ASR model (speech-to-text), not a TTS model. Converts speech audio into transcribed text with multilingual support.",
    "tasks": [
      "streaming",
      "realtime",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 10,
    "min_vram_gb": 6,
    "runtime": [
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-03",
    "path": "/tts/cohere-transcribe-03-2026",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "voxcpm2",
    "name": "VoxCPM2",
    "category": "voice",
    "summary": "Tokenizer-free diffusion autoregressive TTS with 2B parameters, 30 languages, 48kHz output, voice design, controllable cloning and real-time streaming. Apache 2.0 and commercial-ready.",
    "tasks": [
      "cloning",
      "streaming",
      "realtime",
      "multilingual",
      "controllable",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 11,
    "min_vram_gb": 6,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-05",
    "path": "/tts/voxcpm2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "supertonic-3",
    "name": "Supertonic 3",
    "category": "voice",
    "summary": "Lightning-fast on-device TTS that runs with ONNX Runtime and no cloud call. Around 99M parameters, 31 languages, better reading stability and expression tags like laugh, breath and sigh.",
    "tasks": [
      "realtime",
      "low-latency",
      "multilingual",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Onnx"
    ],
    "license": "OpenRAIL-M",
    "local_status": "local",
    "released": "2026-05",
    "path": "/tts/supertonic-3",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "moss-tts-nano",
    "name": "MOSS-TTS-Nano",
    "category": "voice",
    "summary": "Tiny 0.1B multilingual speech generation model for CPU-friendly real-time TTS. Supports voice cloning, streaming, ONNX CPU inference and MLX Audio on Apple Silicon.",
    "tasks": [
      "cloning",
      "streaming",
      "realtime",
      "multilingual",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx",
      "Mlx"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-04",
    "path": "/tts/moss-tts-nano",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "granite-speech-4.1-2b",
    "name": "Granite Speech 4.1 2B",
    "category": "voice",
    "summary": "Compact Apache 2.0 speech-language model for multilingual ASR and bidirectional speech translation. Adds punctuation, truecasing, keyword biasing and Japanese ASR improvements.",
    "tasks": [
      "streaming",
      "realtime",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 10,
    "min_vram_gb": 6,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-04",
    "path": "/tts/granite-speech-4.1-2b",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "qwen3-asr",
    "name": "Qwen3-ASR",
    "category": "voice",
    "summary": "Open-source ASR family with 0.6B and 1.7B models. Supports language identification and speech recognition for 52 languages and dialects, streaming/offline inference and long audio transcription.",
    "tasks": [
      "streaming",
      "realtime",
      "multilingual",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 9,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-01",
    "path": "/tts/qwen3-asr",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "higgs-audio-v2",
    "name": "Higgs Audio v2",
    "category": "voice",
    "summary": "SOTA expressive TTS built on an LLM-audio backbone. Generates natural multi-speaker dialogue, spontaneous laughter, whispers and even background music. Beats ElevenLabs on MOS naturalness in several languages.",
    "tasks": [
      "emotion",
      "dialogue",
      "cloning",
      "streaming",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 14,
    "min_vram_gb": 8,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-07",
    "path": "/tts/higgs-audio-v2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "miso-tts",
    "name": "MisoTTS",
    "category": "voice",
    "summary": "8B English-first emotive conversational TTS model designed for natural dialogue, voice continuation from prompt audio and private local speech experiments. Excellent quality signal, but heavier than small TTS models and best on CUDA GPUs or larger Apple Silicon setups.",
    "tasks": [
      "emotion",
      "dialogue",
      "cloning",
      "controllable",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 40,
    "min_vram_gb": 23,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Other / custom",
    "local_status": "local",
    "released": "2026-05",
    "path": "/tts/miso-tts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "wavtts",
    "name": "WavTTS",
    "category": "voice",
    "summary": "Research-grade zero-shot TTS that generates speech directly in raw waveform space instead of mel spectrograms, codec tokens or VAE latents. High-fidelity EN/ZH voice cloning direction, but the official 16 kHz checkpoint is large and best for CUDA GPU setups.",
    "tasks": [
      "cloning",
      "multilingual",
      "controllable",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 27,
    "min_vram_gb": 16,
    "runtime": [
      "Pytorch"
    ],
    "license": "CC-BY-NC 4.0 weights / MIT code",
    "local_status": "local",
    "released": "2026-06",
    "path": "/tts/wavtts",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "dots-tts-mf",
    "name": "Dots TTS MF",
    "category": "voice",
    "summary": "2B fully continuous end-to-end autoregressive TTS system with zero-shot voice cloning. The MF checkpoint distills dots.tts-soar with MeanFlow for few-step, low-latency inference at 48 kHz, while keeping strong speaker similarity and natural prosody. Apache 2.0.",
    "tasks": [
      "cloning",
      "multilingual",
      "controllable",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 11,
    "min_vram_gb": 6,
    "runtime": [
      "Pytorch",
      "Safetensors",
      "Mlx"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-06",
    "path": "/tts/dots-tts-mf",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "zonos",
    "name": "Zonos v0.1",
    "category": "voice",
    "summary": "1.6B open-weight TTS with ultra-realistic zero-shot cloning from 5-30 s audio. Fine-grained controls: speaking rate, pitch, emotion (happy/sad/angry/fear). Streaming with ~200 ms first-token latency.",
    "tasks": [
      "cloning",
      "emotion",
      "streaming",
      "realtime",
      "controllable",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-02",
    "path": "/tts/zonos",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "index-tts-2",
    "name": "IndexTTS 2",
    "category": "voice",
    "summary": "Bilibili's viral open TTS - exceptional zero-shot cloning and emotion transfer. Separately controls voice timbre and emotional style from two different reference clips. Top quality on Chinese + English.",
    "tasks": [
      "cloning",
      "emotion",
      "streaming",
      "controllable",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 6,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-09",
    "path": "/tts/index-tts-2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "openvoice-v2",
    "name": "OpenVoice V2",
    "category": "voice",
    "summary": "Cross-lingual voice cloning - clone a voice in one language and speak any other. Granular style control (emotion, accent, rhythm, pauses). Very fast inference, GPU-optional.",
    "tasks": [
      "cloning",
      "multilingual",
      "controllable",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Onnx"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-05",
    "path": "/tts/openvoice-v2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "whisper-v3-turbo",
    "name": "Whisper v3 Turbo",
    "category": "voice",
    "summary": "OpenAI's optimized Whisper v3 with 4 decoder layers instead of 32. 8× faster than Whisper Large v3 with only minor accuracy trade-off. 99 languages supported. New gold standard for fast local transcription.",
    "tasks": [
      "streaming",
      "realtime",
      "multilingual",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors",
      "Gguf"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-10",
    "path": "/tts/whisper-v3-turbo",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "parakeet-tdt-0.6b-v2",
    "name": "Parakeet TDT 0.6B v2",
    "category": "voice",
    "summary": "NVIDIA's SOTA lightweight ASR - 0.6B params, #1 on Open ASR Leaderboard for English. TDT (Token-and-Duration Transducer) decoding makes it 50× faster than Whisper Large v3 on GPU. Real-time streaming with word-level timestamps.",
    "tasks": [
      "streaming",
      "realtime",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Nemo",
      "Onnx"
    ],
    "license": "CC-BY-4.0",
    "local_status": "local",
    "released": "2025-05",
    "path": "/tts/parakeet-tdt-0.6b-v2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "canary-1b-v2",
    "name": "Canary 1B v2",
    "category": "voice",
    "summary": "NVIDIA multilingual ASR + speech translation in a single model. 25 European languages, bidirectional EN↔XX translation. Tops Open ASR Leaderboard multilingual category. Word-level timestamps, punctuation & capitalization.",
    "tasks": [
      "streaming",
      "multilingual",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 5,
    "min_vram_gb": 4,
    "runtime": [
      "Nemo"
    ],
    "license": "CC-BY-4.0",
    "local_status": "local",
    "released": "2025-07",
    "path": "/tts/canary-1b-v2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "moshi",
    "name": "Moshi",
    "category": "voice",
    "summary": "Full-duplex spoken dialogue model - listens and speaks simultaneously with ~160 ms latency. Not just a TTS but a real-time conversational speech model. Runs on a single L4 GPU or Mac M3 Pro.",
    "tasks": [
      "dialogue",
      "streaming",
      "realtime",
      "low-latency",
      "emotion",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 19,
    "min_vram_gb": 11,
    "runtime": [
      "Pytorch",
      "Safetensors",
      "Mlx"
    ],
    "license": "CC-BY-4.0",
    "local_status": "local",
    "released": "2024-09",
    "path": "/tts/moshi",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "neutts-air",
    "name": "NeuTTS Air",
    "category": "voice",
    "summary": "First super-realistic TTS LLM that runs in real-time on CPU. 748M params, LLaMA 3.2 backbone + NeuCodec audio tokenizer. GGUF-native - perfect for on-device agents and offline apps. Instant 3s voice cloning.",
    "tasks": [
      "cloning",
      "realtime",
      "streaming",
      "low-latency",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Gguf",
      "Onnx",
      "Pytorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-10",
    "path": "/tts/neutts-air",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "step-audio-2-mini",
    "name": "Step-Audio 2 Mini",
    "category": "voice",
    "summary": "Open-source multi-modal speech LLM. Unified understanding + generation in one model - ASR, TTS, voice conversion, speech dialogue. Strong expressive control and paralinguistic features. Available in Mini (8B) and Full variants.",
    "tasks": [
      "cloning",
      "dialogue",
      "emotion",
      "streaming",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 12,
    "min_vram_gb": 7,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-08",
    "path": "/tts/step-audio-2-mini",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "llasa-3b",
    "name": "LLaSA 3B",
    "category": "voice",
    "summary": "LLaMA-based TTS with pure next-token speech generation - no separate decoder. Scales with compute: the 3B variant matches specialised TTS SOTA on zero-shot cloning. Trained on 250K hours of Chinese + English speech.",
    "tasks": [
      "cloning",
      "streaming",
      "realtime",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 9,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "CC-BY-NC 4.0",
    "local_status": "local",
    "released": "2025-01",
    "path": "/tts/llasa-3b",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "octave-2",
    "name": "OCTAVE 2",
    "category": "voice",
    "summary": "Second-gen emotion-aware speech-language model. Generates voice, style and personality from a text description alone - no reference audio required. Rich control over arousal, valence and speaking style. Research-first release.",
    "tasks": [
      "emotion",
      "controllable",
      "streaming",
      "multilingual",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 5,
    "runtime": [
      "Pytorch",
      "Api"
    ],
    "license": "Hume Terms (research)",
    "local_status": "local",
    "released": "2025-11",
    "path": "/tts/octave-2",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "xtts-v3",
    "name": "XTTS v3 (unverified reference)",
    "category": "voice",
    "summary": "No exact public XTTS v3 checkpoint or official v3 release was verified on August 14, 2026. The route is preserved for transparency and must not be used as installation guidance; XTTS v2 is a different release.",
    "tasks": [
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [],
    "min_ram_gb": 4,
    "min_vram_gb": 0,
    "runtime": [
      "See model card"
    ],
    "license": "Not verified",
    "local_status": "local",
    "released": "",
    "path": "/tts/xtts-v3",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "f5-tts-v1.1",
    "name": "F5-TTS v1 Base",
    "category": "voice",
    "summary": "The official F5TTS_v1_Base checkpoint released in March 2025. The preserved route ID reflects the 1.1 package line, not a separate F5-TTS-v1.1 model checkpoint.",
    "tasks": [
      "cloning",
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 4,
    "min_vram_gb": 4,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "CC-BY-NC-4.0 weights; MIT code",
    "local_status": "local",
    "released": "2025-03-12",
    "path": "/tts/f5-tts-v1.1",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "kyutai-stt-2.6b",
    "name": "Kyutai STT 2.6B English",
    "category": "voice",
    "summary": "Kyutai's English-only 2.6B streaming ASR model. The decoder-only Transformer consumes Mimi audio tokens, uses a documented 2.5-second delay and emits punctuated transcripts with recoverable token timestamps.",
    "tasks": [
      "streaming",
      "tts"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 15,
    "min_vram_gb": 8,
    "runtime": [
      "Pytorch",
      "Safetensors"
    ],
    "license": "CC-BY-4.0",
    "local_status": "local",
    "released": "2025-06",
    "path": "/tts/kyutai-stt-2.6b",
    "resource_basis": "estimated from catalogue size"
  },
  {
    "id": "ltx-video",
    "name": "LTX Video",
    "category": "video",
    "summary": "Local text, image and audio-to-video generation with an official desktop application.",
    "tasks": [
      "text-to-video",
      "image-to-video",
      "audio-to-video",
      "video-editing"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 16,
    "runtime": [
      "LTX Desktop",
      "ComfyUI",
      "PyTorch"
    ],
    "license": "Open weights, model terms apply",
    "local_status": "local",
    "released": "2026-01",
    "path": "/video/ltx-video",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "hunyuanvideo-1.5",
    "name": "HunyuanVideo 1.5",
    "category": "video",
    "summary": "Open-weight text-to-video and image-to-video generation with a lower local memory floor than the original release.",
    "tasks": [
      "text-to-video",
      "image-to-video",
      "video-super-resolution"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 14,
    "runtime": [
      "PyTorch",
      "Diffusers"
    ],
    "license": "Tencent Hunyuan community license",
    "local_status": "local",
    "released": "2025-11",
    "path": "/video/hunyuanvideo-1.5",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "cogvideox-2b",
    "name": "CogVideoX 2B",
    "category": "video",
    "summary": "A compact open text-to-video model with official low-memory Diffusers paths.",
    "tasks": [
      "text-to-video"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 6,
    "runtime": [
      "Diffusers",
      "PyTorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-08",
    "path": "/video/cogvideox-2b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "wan2.2-ti2v-5b",
    "name": "Wan 2.2 TI2V 5B",
    "category": "video",
    "summary": "Unified text and image-to-video generation from the open Wan video family.",
    "tasks": [
      "text-to-video",
      "image-to-video"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 24,
    "runtime": [
      "PyTorch",
      "ComfyUI",
      "Diffusers"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-07",
    "path": "/video/wan2.2-ti2v-5b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "mochi-1",
    "name": "Mochi 1",
    "category": "video",
    "summary": "Open text-to-video foundation model with Diffusers and ComfyUI workflows.",
    "tasks": [
      "text-to-video"
    ],
    "platforms": [
      "linux",
      "windows"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 24,
    "runtime": [
      "Diffusers",
      "ComfyUI",
      "PyTorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-10",
    "path": "/video/mochi-1",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "wan2.1-t2v-1.3b",
    "name": "Wan 2.1 T2V 1.3B",
    "category": "video",
    "summary": "Compact text-to-video member of the Wan family designed to run on consumer NVIDIA GPUs.",
    "tasks": [
      "text-to-video"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch",
      "Diffusers",
      "ComfyUI"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-02",
    "path": "/video/wan2.1-t2v-1.3b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "framepack-f1",
    "name": "FramePack F1",
    "category": "video",
    "summary": "Local image-to-video system that makes long HunyuanVideo generation practical on laptop and desktop GPUs.",
    "tasks": [
      "image-to-video",
      "long-video-generation"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 6,
    "runtime": [
      "FramePack desktop",
      "PyTorch",
      "Gradio"
    ],
    "license": "Open code, Hunyuan model terms apply",
    "local_status": "local",
    "released": "2025-04",
    "path": "/video/framepack-f1",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "vace-wan2.1-1.3b",
    "name": "VACE Wan 2.1 1.3B",
    "category": "video",
    "summary": "All-in-one local video creation and editing model for reference, masked and video-to-video workflows.",
    "tasks": [
      "reference-to-video",
      "video-to-video",
      "video-inpainting",
      "video-editing"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 10,
    "runtime": [
      "PyTorch",
      "ComfyUI",
      "VACE CLI"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-05",
    "path": "/video/vace-wan2.1-1.3b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "ltx-video-0.9.8-distilled",
    "name": "LTX Video 0.9.8 Distilled",
    "category": "video",
    "summary": "Distilled LTX checkpoint for faster local text-to-video and image-to-video workflows.",
    "tasks": [
      "text-to-video",
      "image-to-video"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 12,
    "runtime": [
      "ComfyUI",
      "Diffusers",
      "PyTorch"
    ],
    "license": "Open weights, model terms apply",
    "local_status": "local",
    "released": "2025-05",
    "path": "/video/ltx-video-0.9.8-distilled",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "cogvideox-5b",
    "name": "CogVideoX 5B",
    "category": "video",
    "summary": "Higher-capacity CogVideoX text-to-video model with official Diffusers quantization and CPU offloading paths.",
    "tasks": [
      "text-to-video"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 12,
    "runtime": [
      "Diffusers",
      "ComfyUI",
      "PyTorch"
    ],
    "license": "CogVideoX model license",
    "local_status": "local",
    "released": "2024-08",
    "path": "/video/cogvideox-5b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "stable-video-diffusion-xt-1.1",
    "name": "Stable Video Diffusion XT 1.1",
    "category": "video",
    "summary": "Mature local image-to-video model for short 25-frame clips with a large community runtime ecosystem.",
    "tasks": [
      "image-to-video"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "Diffusers",
      "ComfyUI",
      "PyTorch"
    ],
    "license": "Stability AI Community License",
    "local_status": "local",
    "released": "2024-02",
    "path": "/video/stable-video-diffusion-xt-1.1",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "animatediff-sd15",
    "name": "AnimateDiff SD 1.5",
    "category": "video",
    "summary": "Lightweight motion modules that animate Stable Diffusion 1.5 models on mainstream local GPUs.",
    "tasks": [
      "text-to-video",
      "image-animation",
      "camera-motion"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "ComfyUI",
      "Diffusers",
      "PyTorch"
    ],
    "license": "CreativeML Open RAIL-M and module terms",
    "local_status": "local",
    "released": "2023-07",
    "path": "/video/animatediff-sd15",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "videocrafter2",
    "name": "VideoCrafter2",
    "category": "video",
    "summary": "Open local toolbox with dedicated text-to-video and image-to-video checkpoints.",
    "tasks": [
      "text-to-video",
      "image-to-video"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 12,
    "runtime": [
      "PyTorch",
      "Gradio"
    ],
    "license": "Research use, repository terms apply",
    "local_status": "local",
    "released": "2024-01",
    "path": "/video/videocrafter2",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "dynamicrafter-512",
    "name": "DynamiCrafter 512",
    "category": "video",
    "summary": "Image animation model that turns a still image and text prompt into a locally generated video.",
    "tasks": [
      "image-to-video",
      "image-animation"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 12,
    "runtime": [
      "PyTorch",
      "Gradio"
    ],
    "license": "Research use, model terms apply",
    "local_status": "local",
    "released": "2023-10",
    "path": "/video/dynamicrafter-512",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "wan2.1-i2v-14b-gp",
    "name": "Wan 2.1 I2V 14B via Wan2GP",
    "category": "video",
    "summary": "High-quality Wan image-to-video model packaged with aggressive CPU offloading for consumer NVIDIA systems.",
    "tasks": [
      "image-to-video",
      "video-extension"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 12,
    "runtime": [
      "Wan2GP",
      "Gradio",
      "PyTorch"
    ],
    "license": "Apache 2.0 model, runtime license applies",
    "local_status": "local",
    "released": "2025-03",
    "path": "/video/wan2.1-i2v-14b-gp",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "stable-fast-3d",
    "name": "Stable Fast 3D",
    "category": "3d",
    "summary": "Single-image reconstruction into a textured GLB mesh with UV unwrapping and material prediction.",
    "tasks": [
      "image-to-3d",
      "mesh-reconstruction",
      "texturing"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 6,
    "runtime": [
      "PyTorch",
      "ComfyUI",
      "Gradio"
    ],
    "license": "Stability AI Community License",
    "local_status": "local",
    "released": "2024-08",
    "path": "/3d/stable-fast-3d",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "hunyuan3d-2.1",
    "name": "Hunyuan3D 2.1",
    "category": "3d",
    "summary": "Two-stage open image-to-3D pipeline for mesh geometry and texture generation.",
    "tasks": [
      "image-to-3d",
      "mesh-reconstruction",
      "texturing"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 6,
    "runtime": [
      "PyTorch",
      "ComfyUI",
      "Local API"
    ],
    "license": "Tencent Hunyuan community license",
    "local_status": "local",
    "released": "2025-06",
    "path": "/3d/hunyuan3d-2.1",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "trellis-image-large",
    "name": "TRELLIS Image Large",
    "category": "3d",
    "summary": "High-quality image-to-3D generation producing meshes, radiance fields and 3D Gaussian assets.",
    "tasks": [
      "image-to-3d",
      "gaussian-splatting",
      "mesh-generation"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 24,
    "runtime": [
      "PyTorch"
    ],
    "license": "MIT code, model terms apply",
    "local_status": "local",
    "released": "2024-12",
    "path": "/3d/trellis-image-large",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "trellis-2",
    "name": "TRELLIS.2 4B",
    "category": "3d",
    "summary": "High-resolution image-to-3D generation with complex topology and full PBR materials.",
    "tasks": [
      "image-to-3d",
      "pbr-texturing",
      "mesh-generation"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 64,
    "min_vram_gb": 24,
    "runtime": [
      "PyTorch"
    ],
    "license": "MIT code, model terms apply",
    "local_status": "local",
    "released": "2026-03",
    "path": "/3d/trellis-2",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "triposr",
    "name": "TripoSR",
    "category": "3d",
    "summary": "Fast single-image 3D reconstruction designed for accessible local inference.",
    "tasks": [
      "image-to-3d",
      "mesh-reconstruction"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 6,
    "runtime": [
      "PyTorch",
      "Gradio"
    ],
    "license": "MIT code, model terms apply",
    "local_status": "local",
    "released": "2024-03",
    "path": "/3d/triposr",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "hunyuan3d-2-mini-turbo",
    "name": "Hunyuan3D 2 Mini Turbo",
    "category": "3d",
    "summary": "Distilled 0.6B image-to-shape model built for lower-memory local 3D generation.",
    "tasks": [
      "image-to-3d",
      "mesh-generation"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 6,
    "runtime": [
      "Hunyuan3D-2GP",
      "PyTorch",
      "Gradio"
    ],
    "license": "Tencent Hunyuan community license",
    "local_status": "local",
    "released": "2025-03",
    "path": "/3d/hunyuan3d-2-mini-turbo",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "hunyuan3d-swift",
    "name": "Hunyuan3D Swift",
    "category": "3d",
    "summary": "Native Swift and MLX port of Hunyuan3D shape and paint pipelines for Apple Silicon.",
    "tasks": [
      "image-to-3d",
      "mesh-generation",
      "texturing"
    ],
    "platforms": [
      "macos"
    ],
    "accelerators": [
      "apple-silicon"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 0,
    "runtime": [
      "Swift",
      "MLX",
      "Modelr"
    ],
    "license": "MIT runtime, original model terms apply",
    "local_status": "local",
    "released": "2026-07",
    "path": "/3d/hunyuan3d-swift",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "spar3d",
    "name": "SPAR3D",
    "category": "3d",
    "summary": "Point-aware single-image reconstruction with editable point clouds and textured GLB output.",
    "tasks": [
      "image-to-3d",
      "mesh-reconstruction",
      "point-cloud-editing",
      "texturing"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 7,
    "runtime": [
      "PyTorch",
      "Gradio",
      "ComfyUI"
    ],
    "license": "Stability AI Community License",
    "local_status": "local",
    "released": "2025-02",
    "path": "/3d/spar3d",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "triposg",
    "name": "TripoSG 1.5B",
    "category": "3d",
    "summary": "High-fidelity image-to-shape model that exports controllable GLB meshes on consumer GPUs.",
    "tasks": [
      "image-to-3d",
      "mesh-generation",
      "scribble-to-3d"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch",
      "Gradio"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-03",
    "path": "/3d/triposg",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "partcrafter",
    "name": "PartCrafter",
    "category": "3d",
    "summary": "Structured image-to-3D generation that produces objects and scenes as separately editable parts.",
    "tasks": [
      "image-to-3d",
      "part-based-generation",
      "scene-generation"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2025-07",
    "path": "/3d/partcrafter",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "instantmesh",
    "name": "InstantMesh",
    "category": "3d",
    "summary": "Feed-forward single-image reconstruction with multiple mesh and NeRF checkpoint sizes.",
    "tasks": [
      "image-to-3d",
      "mesh-reconstruction",
      "nerf-reconstruction",
      "texturing"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 16,
    "runtime": [
      "PyTorch",
      "Gradio",
      "Docker"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-04",
    "path": "/3d/instantmesh",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "crm",
    "name": "CRM",
    "category": "3d",
    "summary": "Single-image model that reconstructs a UV-textured mesh through six consistent views.",
    "tasks": [
      "image-to-3d",
      "multiview-generation",
      "mesh-reconstruction",
      "texturing"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 16,
    "runtime": [
      "PyTorch",
      "Gradio"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-01",
    "path": "/3d/crm",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "wonder3d",
    "name": "Wonder3D",
    "category": "3d",
    "summary": "Single-image reconstruction using consistent multiview color and normal-map diffusion.",
    "tasks": [
      "image-to-3d",
      "multiview-generation",
      "normal-generation",
      "mesh-reconstruction"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 16,
    "runtime": [
      "PyTorch",
      "Diffusers"
    ],
    "license": "Repository and model terms apply",
    "local_status": "local",
    "released": "2023-10",
    "path": "/3d/wonder3d",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "dreamgaussian",
    "name": "DreamGaussian",
    "category": "3d",
    "summary": "Fast text-to-3D and image-to-3D generation using Gaussian splatting followed by mesh extraction.",
    "tasks": [
      "text-to-3d",
      "image-to-3d",
      "gaussian-splatting",
      "mesh-generation"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch",
      "GUI"
    ],
    "license": "Repository license applies",
    "local_status": "local",
    "released": "2023-09",
    "path": "/3d/dreamgaussian",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "shap-e",
    "name": "Shap-E",
    "category": "3d",
    "summary": "Compact open model that generates implicit 3D functions from text or synthetic images.",
    "tasks": [
      "text-to-3d",
      "image-to-3d",
      "implicit-3d-generation"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch",
      "Jupyter"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2023-05",
    "path": "/3d/shap-e",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "trellis-text-base",
    "name": "TRELLIS Text Base",
    "category": "3d",
    "summary": "Official 342M text-to-3D checkpoint producing meshes, radiance fields and 3D Gaussians.",
    "tasks": [
      "text-to-3d",
      "gaussian-splatting",
      "mesh-generation"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 16,
    "runtime": [
      "PyTorch"
    ],
    "license": "MIT code, model terms apply",
    "local_status": "local",
    "released": "2024-12",
    "path": "/3d/trellis-text-base",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "openlrm",
    "name": "OpenLRM",
    "category": "3d",
    "summary": "Open implementation of large reconstruction models with image-to-NeRF and optional mesh export.",
    "tasks": [
      "image-to-3d",
      "nerf-reconstruction",
      "mesh-reconstruction"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 16,
    "runtime": [
      "PyTorch",
      "Accelerate"
    ],
    "license": "Apache 2.0 code, checkpoint terms apply",
    "local_status": "local",
    "released": "2023-11",
    "path": "/3d/openlrm",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "flux-2-klein-4b",
    "name": "FLUX.2 Klein 4B",
    "category": "image",
    "summary": "Fast open image generation and multi-reference editing for consumer NVIDIA GPUs.",
    "tasks": [
      "text-to-image",
      "image-editing",
      "multi-reference"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch",
      "Diffusers"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-01",
    "path": "/image/flux-2-klein-4b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "flux-1-schnell",
    "name": "FLUX.1 Schnell",
    "category": "image",
    "summary": "Four-step open text-to-image model with Diffusers, ComfyUI and local inference support.",
    "tasks": [
      "text-to-image"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 16,
    "runtime": [
      "Diffusers",
      "ComfyUI",
      "PyTorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-08",
    "path": "/image/flux-1-schnell",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "stable-diffusion-3.5-medium",
    "name": "Stable Diffusion 3.5 Medium",
    "category": "image",
    "summary": "General text-to-image foundation model with official local inference and broad tooling support.",
    "tasks": [
      "text-to-image",
      "controlnet"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 12,
    "runtime": [
      "PyTorch",
      "Diffusers",
      "ComfyUI"
    ],
    "license": "Stability AI Community License",
    "local_status": "local",
    "released": "2024-10",
    "path": "/image/stable-diffusion-3.5-medium",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "qwen-image-2512",
    "name": "Qwen Image 2512",
    "category": "image",
    "summary": "Open image generation model focused on complex text rendering, realism and precise editing.",
    "tasks": [
      "text-to-image",
      "image-editing",
      "text-rendering"
    ],
    "platforms": [
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 24,
    "runtime": [
      "Diffusers",
      "SGLang",
      "PyTorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-12",
    "path": "/image/qwen-image-2512",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "sdxl-base-1.0",
    "name": "Stable Diffusion XL Base",
    "category": "image",
    "summary": "Mature local image model with one of the broadest ComfyUI and fine-tuning ecosystems.",
    "tasks": [
      "text-to-image",
      "image-to-image",
      "inpainting"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "amd"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "Diffusers",
      "ComfyUI",
      "Draw Things"
    ],
    "license": "CreativeML Open RAIL++-M",
    "local_status": "local",
    "released": "2023-07",
    "path": "/image/sdxl-base-1.0",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "ace-step-1.5",
    "name": "ACE-Step 1.5",
    "category": "music",
    "summary": "Local music generation for songs, remixes, repainting and lyric-conditioned workflows.",
    "tasks": [
      "text-to-music",
      "lyrics-to-song",
      "remix",
      "audio-repainting"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "Local server",
      "ComfyUI",
      "PyTorch"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-03",
    "path": "/music/ace-step-1.5",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "yue",
    "name": "YuE",
    "category": "music",
    "summary": "Open lyrics-to-song foundation model for multi-minute songs with vocals and accompaniment.",
    "tasks": [
      "lyrics-to-song",
      "music-continuation",
      "style-conditioning"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 32,
    "min_vram_gb": 8,
    "runtime": [
      "PyTorch",
      "YuE UI"
    ],
    "license": "Apache 2.0 with attribution request",
    "local_status": "local",
    "released": "2025-01",
    "path": "/music/yue",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "musicgen-small",
    "name": "MusicGen Small",
    "category": "music",
    "summary": "Compact text-to-music model from AudioCraft for short instrumental generations.",
    "tasks": [
      "text-to-music"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "AudioCraft",
      "Transformers"
    ],
    "license": "CC BY-NC 4.0 weights",
    "local_status": "local",
    "released": "2023-06",
    "path": "/music/musicgen-small",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "musicgen-medium",
    "name": "MusicGen Medium",
    "category": "music",
    "summary": "Higher-quality text-to-music and melody-conditioned generation through AudioCraft.",
    "tasks": [
      "text-to-music",
      "melody-to-music"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 16,
    "runtime": [
      "AudioCraft"
    ],
    "license": "CC BY-NC 4.0 weights",
    "local_status": "local",
    "released": "2023-06",
    "path": "/music/musicgen-medium",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "stable-audio-open",
    "name": "Stable Audio Open",
    "category": "music",
    "summary": "Open local generation for short music samples, sound effects and production elements.",
    "tasks": [
      "text-to-audio",
      "sound-effects",
      "music-samples"
    ],
    "platforms": [
      "windows",
      "linux"
    ],
    "accelerators": [
      "nvidia"
    ],
    "min_ram_gb": 24,
    "min_vram_gb": 12,
    "runtime": [
      "stable-audio-tools",
      "ComfyUI"
    ],
    "license": "Stability AI Community License",
    "local_status": "local",
    "released": "2024-06",
    "path": "/music/stable-audio-open",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "paddleocr-vl-1.6",
    "name": "PaddleOCR-VL 1.6",
    "category": "vision",
    "summary": "Local document parsing, OCR, layout recognition and structured extraction across many hardware backends.",
    "tasks": [
      "ocr",
      "document-understanding",
      "layout-analysis"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "amd",
      "cpu"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "PaddlePaddle",
      "Transformers",
      "MLX-VLM",
      "llama.cpp"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2026-05",
    "path": "/vision/paddleocr-vl-1.6",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "florence-2-base",
    "name": "Florence-2 Base",
    "category": "vision",
    "summary": "Compact general vision model for captioning, OCR, detection, segmentation and grounding.",
    "tasks": [
      "image-captioning",
      "ocr",
      "object-detection",
      "segmentation"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 4,
    "runtime": [
      "Transformers",
      "ONNX"
    ],
    "license": "MIT",
    "local_status": "local",
    "released": "2024-06",
    "path": "/vision/florence-2-base",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "moondream-2",
    "name": "Moondream 2",
    "category": "vision",
    "summary": "Small vision-language model designed for local image understanding and edge deployment.",
    "tasks": [
      "visual-question-answering",
      "image-captioning",
      "object-detection"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 4,
    "runtime": [
      "Transformers",
      "ONNX",
      "MLX"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2024-06",
    "path": "/vision/moondream-2",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "qwen2.5-vl-3b",
    "name": "Qwen2.5-VL 3B",
    "category": "vision",
    "summary": "Compact multimodal model for images, documents, charts and video understanding.",
    "tasks": [
      "visual-question-answering",
      "document-understanding",
      "video-understanding"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia"
    ],
    "min_ram_gb": 16,
    "min_vram_gb": 8,
    "runtime": [
      "Transformers",
      "MLX-VLM",
      "llama.cpp"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-02",
    "path": "/vision/qwen2.5-vl-3b",
    "resource_basis": "source-backed floor"
  },
  {
    "id": "smolvlm2-2.2b",
    "name": "SmolVLM2 2.2B",
    "category": "vision",
    "summary": "Compact vision-language model for image and video understanding on local hardware.",
    "tasks": [
      "image-captioning",
      "visual-question-answering",
      "video-understanding"
    ],
    "platforms": [
      "macos",
      "windows",
      "linux"
    ],
    "accelerators": [
      "apple-silicon",
      "nvidia",
      "cpu"
    ],
    "min_ram_gb": 8,
    "min_vram_gb": 4,
    "runtime": [
      "Transformers",
      "MLX-VLM",
      "ONNX"
    ],
    "license": "Apache 2.0",
    "local_status": "local",
    "released": "2025-02",
    "path": "/vision/smolvlm2-2.2b",
    "resource_basis": "source-backed floor"
  }
];
})(typeof window !== 'undefined' ? window : globalThis);
