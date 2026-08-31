// Source of truth for the static Software directory, filters and structured data.
// Platform tags include documented setup paths; qualifications stay visible in each row.
const checkedOn = '2026-08-31';

const roles = {
  desktop: 'Desktop apps',
  server: 'Model servers',
  engine: 'Inference engines',
  interface: 'Web interfaces',
  stack: 'Complete stacks'
};

const platforms = { macos: 'macOS', windows: 'Windows', linux: 'Linux' };
const uses = {
  chat: 'Chat',
  run: 'CLI / code',
  serve: 'Local API',
  documents: 'Document chat',
  train: 'Fine-tuning',
  agents: 'Agent workflows'
};

const software = [
  {
    id: 'localclaw', name: 'LocalClaw', roles: ['stack'], platforms: ['macos'], uses: ['agents'],
    type: 'Complete stack', workflow: 'OpenClaw setup · Agent management', badge: 'Featured',
    description: 'Install and manage OpenClaw from a native Mac app. Your chosen provider or local runtime handles model inference.',
    platformNote: 'macOS 13+ · Apple Silicon or Intel. The Mac app requires a paid license.',
    icon: '/images/logo-localclaw.svg', href: '/pricing',
    action: { label: 'Explore', href: '/pricing' },
    docs: 'https://localclaw.io/download',
    sources: ['https://localclaw.io/download', 'https://localclaw.io/pricing'],
    keywords: 'openclaw control center orchestration automation mac'
  },
  {
    id: 'lm-studio', name: 'LM Studio', roles: ['desktop', 'server'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'serve', 'documents'],
    type: 'Desktop app + server', workflow: 'Visual chat · Documents · Local API', badge: 'Easy start',
    description: 'Find, download and chat with local models in a visual app, or expose them through a local API.',
    platformNote: 'Mac: Apple Silicon, macOS 14+. Windows and Linux: supported x64 / ARM builds.',
    icon: '/images/software/icons/lm-studio.png', href: '/software/lm-studio',
    action: { label: 'Download', href: 'https://lmstudio.ai/download' },
    docs: 'https://lmstudio.ai/docs/app/system-requirements',
    sources: ['https://lmstudio.ai/docs/app/system-requirements', 'https://lmstudio.ai/docs/app'],
    keywords: 'gguf mlx local api rag documents mac apple silicon'
  },
  {
    id: 'ollama', name: 'Ollama', roles: ['server'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'run', 'serve'],
    type: 'Model runner + server', workflow: 'CLI chat · Model management · API',
    description: 'Download, run and serve models with a command-line workflow and local API for other apps.',
    platformNote: 'Hardware acceleration depends on the OS and GPU. Choose a local model for on-device inference.',
    icon: '/images/software/icons/ollama.png', iconClass: 'sw-product-icon--ollama', href: 'https://ollama.com',
    action: { label: 'Download', href: 'https://ollama.com/download' },
    docs: 'https://docs.ollama.com',
    sources: ['https://ollama.com/download', 'https://docs.ollama.com'],
    keywords: 'terminal cli gguf local api mac'
  },
  {
    id: 'jan', name: 'Jan', roles: ['desktop', 'server'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'serve', 'documents'],
    type: 'Desktop app + server', workflow: 'Visual chat · Files · Local API',
    description: 'A desktop workspace for local model chat, file attachments and an OpenAI-compatible server. Cloud providers are optional.',
    platformNote: 'Desktop installers for all three systems. The selected model and inference backend determine hardware needs.',
    icon: '/images/software/icons/jan.png', href: 'https://www.jan.ai',
    iconSource: 'https://github.com/janhq/jan/blob/main/src-tauri/icons/icon.png',
    action: { label: 'Get app', href: 'https://www.jan.ai/docs/desktop' },
    docs: 'https://www.jan.ai/docs/desktop',
    sources: ['https://www.jan.ai/docs/desktop'],
    keywords: 'local chat openai compatible api files mac'
  },
  {
    id: 'unsloth', name: 'Unsloth', roles: ['desktop', 'server'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'serve', 'train'],
    type: 'Desktop app + training', workflow: 'Chat · Fine-tuning · Model serving',
    description: 'Run, train and serve models from a visual workspace. Training and inference have different hardware requirements.',
    platformNote: 'Mac download: Apple Silicon. Training support varies by GPU, system and backend.',
    icon: '/images/software/icons/unsloth-sticker.png', href: 'https://unsloth.ai',
    action: { label: 'Download', href: 'https://unsloth.ai/download' },
    docs: 'https://docs.unsloth.ai',
    sources: ['https://unsloth.ai/download', 'https://docs.unsloth.ai'],
    keywords: 'fine tuning finetuning lora qlora training mac'
  },
  {
    id: 'anythingllm', name: 'AnythingLLM', roles: ['desktop', 'interface'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'documents', 'agents'],
    type: 'Desktop / web workspace', workflow: 'Document chat · RAG · Agents',
    description: 'Organize documents, chat with your files and run agent workflows. Connect local or cloud model providers.',
    platformNote: 'Desktop for personal use; Docker for a shared browser workspace. Configure local providers to keep inference local.',
    icon: '/images/software/icons/anythingllm.png', href: 'https://anythingllm.com',
    iconSource: 'https://github.com/Mintplex-Labs/anything-llm/blob/master/frontend/src/media/logo/anything-llm-icon.png',
    action: { label: 'Get app', href: 'https://docs.anythingllm.com/installation-desktop/overview' },
    docs: 'https://docs.anythingllm.com/installation-desktop/overview',
    sources: ['https://docs.anythingllm.com/installation-desktop/overview'],
    keywords: 'anything llm rag retrieval documents files agent docker self hosted mac'
  },
  {
    id: 'open-webui', name: 'Open WebUI', roles: ['interface'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'documents'],
    type: 'Self-hosted web interface', workflow: 'Browser chat · Documents · RAG',
    description: 'A browser interface for model chat and document search. Connect it to Ollama or another supported model server.',
    platformNote: 'Install with Docker or Python. Local inference requires a configured local model backend.',
    icon: '/images/software/icons/open-webui.png', href: 'https://openwebui.com',
    iconSource: 'https://github.com/open-webui/open-webui/blob/main/backend/open_webui/static/favicon-96x96.png',
    action: { label: 'Set up', href: 'https://docs.openwebui.com/getting-started/quick-start/' },
    docs: 'https://docs.openwebui.com',
    sources: ['https://docs.openwebui.com/getting-started/quick-start/', 'https://docs.openwebui.com'],
    keywords: 'openwebui open web ui rag retrieval documents files docker self hosted mac'
  },
  {
    id: 'colibri', name: 'Colibri', roles: ['engine', 'server'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'run', 'serve'],
    type: 'Streaming inference engine', workflow: 'MoE offloading · CLI · Local API', badge: 'Advanced',
    description: 'Streams MoE experts between disk, RAM and optional GPU memory. A research-oriented runtime for large local models.',
    platformNote: 'Model-specific setup: GLM-5.2 weights alone need about 372 GB of disk. Speed depends heavily on storage and cache.',
    icon: '/images/software/icons/colibri.png', href: 'https://github.com/JustVugg/colibri',
    iconSource: 'https://github.com/JustVugg/colibri/blob/main/desktop/src-tauri/icons/icon.png',
    action: { label: 'Set up', href: 'https://github.com/JustVugg/colibri/blob/main/docs/quickstart.md' },
    docs: 'https://github.com/JustVugg/colibri',
    sources: ['https://github.com/JustVugg/colibri', 'https://github.com/JustVugg/colibri/blob/main/docs/quickstart.md'],
    keywords: 'colibrì coli moe streaming offload cpu ram disk cache research mac'
  },
  {
    id: 'llama-cpp', name: 'llama.cpp', roles: ['engine', 'server'], platforms: ['macos', 'windows', 'linux'], uses: ['chat', 'run', 'serve'],
    type: 'Inference engine + server', workflow: 'GGUF models · CLI · Local API',
    description: 'Run GGUF models with direct control over CPU and GPU inference, or serve them to other apps.',
    platformNote: 'CPU, Apple Metal, CUDA, Vulkan and other backends. Choose the build for your hardware.',
    icon: '/images/software/icons/llama-cpp.png', href: 'https://github.com/ggml-org/llama.cpp',
    action: { label: 'Set up', href: 'https://llama.app' },
    docs: 'https://github.com/ggml-org/llama.cpp',
    sources: ['https://github.com/ggml-org/llama.cpp'],
    keywords: 'llamacpp llama cpp gguf cpu gpu metal cuda vulkan mac'
  },
  {
    id: 'mlx', name: 'MLX', roles: ['engine'], platforms: ['macos', 'linux'], uses: ['run', 'train'],
    type: 'Machine learning framework', workflow: 'Inference · Training · Python / C++',
    description: 'A framework for building and running machine learning workloads. Use companion tools such as MLX LM for language models.',
    platformNote: 'Mac: Apple Silicon. Linux: CUDA or CPU packages. Framework and model-tool support can differ.',
    icon: '/images/software/icons/mlx.png', href: 'https://github.com/ml-explore/mlx',
    action: { label: 'Set up', href: 'https://ml-explore.github.io/mlx/build/html/install.html' },
    docs: 'https://ml-explore.github.io/mlx/build/html/install.html',
    sources: ['https://ml-explore.github.io/mlx/build/html/install.html', 'https://github.com/ml-explore/mlx'],
    keywords: 'apple silicon metal cuda cpu python framework fine tuning finetuning mac'
  },
  {
    id: 'freetoken', name: 'FreeToken', roles: ['engine', 'server', 'desktop'], platforms: ['windows', 'linux'], uses: ['chat', 'run', 'serve'],
    type: 'MoE engine + desktop app', workflow: 'Expert caching · Chat · Local API', badge: 'NVIDIA',
    description: 'An MoE inference and serving engine that shares work across CPU, memory and NVIDIA GPUs. A desktop app is also available.',
    platformNote: 'Linux CLI: x86_64, NVIDIA and CUDA 13. Windows uses the desktop setup; check its requirements separately.',
    icon: '/images/software/icons/freetoken-icon.svg', href: 'https://github.com/FlashML-org/FreeToken',
    action: { label: 'Get app', href: 'https://www.flashml.ai' },
    docs: 'https://github.com/FlashML-org/FreeToken/blob/main/docs/install.md',
    sources: ['https://github.com/FlashML-org/FreeToken', 'https://github.com/FlashML-org/FreeToken/blob/main/docs/install.md'],
    keywords: 'free token moe nvidia cuda gpu offload caching'
  },
  {
    id: 'vllm', name: 'vLLM', roles: ['server', 'engine'], platforms: ['linux', 'macos', 'windows'], uses: ['run', 'serve'],
    type: 'Inference engine + server', workflow: 'Batched inference · Model APIs',
    description: 'Serve language models for concurrent requests and developer applications. Installation depends on the compute backend.',
    platformNote: 'Linux runtime; Windows via WSL. Apple Silicon uses the community vLLM-Metal plugin, not the standard Linux package.',
    icon: '/images/software/icons/vllm.png', href: 'https://docs.vllm.ai',
    action: { label: 'Set up', href: 'https://docs.vllm.ai/en/latest/getting_started/installation/' },
    docs: 'https://docs.vllm.ai/en/latest/getting_started/installation/gpu/',
    sources: ['https://docs.vllm.ai/en/latest/getting_started/installation/', 'https://docs.vllm.ai/en/latest/getting_started/installation/gpu/'],
    keywords: 'vllm metal wsl nvidia amd rocm cuda serving batching mac'
  },
  {
    id: 'sglang', name: 'SGLang', roles: ['server', 'engine'], platforms: ['linux', 'macos'], uses: ['run', 'serve'],
    type: 'Inference engine + server', workflow: 'Structured generation · Model APIs',
    description: 'An inference runtime for serving models and structured generation workloads, with platform-specific backends.',
    platformNote: 'Linux CPU / GPU setups. Mac requires Apple Silicon and the documented MLX installation path.',
    icon: '/images/software/icons/sglang.png', href: 'https://docs.sglang.io',
    action: { label: 'Set up', href: 'https://docs.sglang.io/docs/get-started/install' },
    docs: 'https://docs.sglang.io/docs/get-started/install',
    sources: ['https://docs.sglang.io/docs/get-started/install', 'https://docs.sglang.io/docs/hardware-platforms/apple_metal'],
    keywords: 'sglang mlx cuda metal cpu gpu structured generation mac'
  }
];

module.exports = { checkedOn, roles, platforms, uses, software };
