(function exposeLocalAiCatalog(root) {
  const models = [
    {
      id: 'ltx-video', name: 'LTX Video', category: 'video', developer: 'Lightricks',
      summary: 'Local text, image and audio-to-video generation with an official desktop application.',
      tasks: ['text-to-video', 'image-to-video', 'audio-to-video', 'video-editing'],
      platforms: ['macos', 'windows', 'linux'], accelerators: ['apple-silicon', 'nvidia'],
      min_ram_gb: 32, min_vram_gb: 16, runtime: ['LTX Desktop', 'ComfyUI', 'PyTorch'],
      output: ['MP4'], local_status: 'local', license: 'Open weights, model terms apply', released: '2026-01',
      source_url: 'https://github.com/Lightricks/LTX-Video', install_url: 'https://github.com/Lightricks/ltx-desktop',
      hardware_note: 'Official desktop guidance supports Apple Silicon with at least 15 GB free memory and NVIDIA systems with at least 16 GB VRAM.',
      strengths: ['Official local desktop path', 'Apple Silicon and NVIDIA support', 'Generation and editing workflows'],
      caveats: ['Large downloads', 'Generation speed varies sharply by resolution and duration']
    },
    {
      id: 'hunyuanvideo-1.5', name: 'HunyuanVideo 1.5', category: 'video', developer: 'Tencent Hunyuan',
      summary: 'Open-weight text-to-video and image-to-video generation with a lower local memory floor than the original release.',
      tasks: ['text-to-video', 'image-to-video', 'video-super-resolution'],
      platforms: ['linux'], accelerators: ['nvidia'], min_ram_gb: 32, min_vram_gb: 14,
      runtime: ['PyTorch', 'Diffusers'], output: ['MP4'], local_status: 'local', license: 'Tencent Hunyuan community license', released: '2025-11',
      source_url: 'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5', install_url: 'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5',
      hardware_note: 'The official repository lists 14 GB minimum NVIDIA VRAM when model offloading is enabled.',
      strengths: ['720p generation', 'Text and image conditioning', 'Official inference code and weights'],
      caveats: ['Linux and CUDA focused', 'Offloading reduces speed']
    },
    {
      id: 'cogvideox-2b', name: 'CogVideoX 2B', category: 'video', developer: 'Zhipu AI / THUDM',
      summary: 'A compact open text-to-video model with official low-memory Diffusers paths.',
      tasks: ['text-to-video'], platforms: ['windows', 'linux'], accelerators: ['nvidia'],
      min_ram_gb: 16, min_vram_gb: 6, runtime: ['Diffusers', 'PyTorch'], output: ['MP4'],
      local_status: 'local', license: 'Apache 2.0', released: '2024-08',
      source_url: 'https://github.com/zai-org/CogVideo', install_url: 'https://github.com/zai-org/CogVideo',
      hardware_note: 'Official Diffusers guidance documents memory-optimized inference below the full-precision requirement. Six GB is a conservative practical floor.',
      strengths: ['Relatively accessible hardware', 'Apache 2.0 weights', 'Diffusers integration'],
      caveats: ['Short clips', 'English prompts are the safest official path']
    },
    {
      id: 'wan2.2-ti2v-5b', name: 'Wan 2.2 TI2V 5B', category: 'video', developer: 'Wan Team / Alibaba',
      summary: 'Unified text and image-to-video generation from the open Wan video family.',
      tasks: ['text-to-video', 'image-to-video'], platforms: ['linux'], accelerators: ['nvidia'],
      min_ram_gb: 32, min_vram_gb: 24, runtime: ['PyTorch', 'ComfyUI', 'Diffusers'], output: ['MP4'],
      local_status: 'local', license: 'Apache 2.0', released: '2025-07',
      source_url: 'https://github.com/Wan-Video/Wan2.2', install_url: 'https://github.com/Wan-Video/Wan2.2',
      hardware_note: 'The 5B TI2V line is the practical entry point. Quantized ComfyUI workflows can lower the memory requirement, but are runtime-dependent.',
      strengths: ['Text and image input', 'Strong ComfyUI ecosystem', 'Official weights and code'],
      caveats: ['CUDA-first official setup', 'Long clips remain compute intensive']
    },
    {
      id: 'mochi-1', name: 'Mochi 1', category: 'video', developer: 'Genmo',
      summary: 'Open text-to-video foundation model with Diffusers and ComfyUI workflows.',
      tasks: ['text-to-video'], platforms: ['linux', 'windows'], accelerators: ['nvidia'],
      min_ram_gb: 32, min_vram_gb: 24, runtime: ['Diffusers', 'ComfyUI', 'PyTorch'], output: ['MP4'],
      local_status: 'local', license: 'Apache 2.0', released: '2024-10',
      source_url: 'https://github.com/genmoai/models', install_url: 'https://github.com/genmoai/models',
      hardware_note: 'Use memory offloading or quantized community workflows on consumer GPUs. Full precision requires substantially more memory.',
      strengths: ['Apache 2.0', 'Open inference stack', 'Good motion consistency for its generation'],
      caveats: ['Heavy full-precision model', 'Consumer workflows rely on optimization']
    },

    {
      id: 'stable-fast-3d', name: 'Stable Fast 3D', category: '3d', developer: 'Stability AI',
      summary: 'Single-image reconstruction into a textured GLB mesh with UV unwrapping and material prediction.',
      tasks: ['image-to-3d', 'mesh-reconstruction', 'texturing'],
      platforms: ['macos', 'windows', 'linux'], accelerators: ['apple-silicon', 'nvidia', 'cpu'],
      min_ram_gb: 16, min_vram_gb: 6, runtime: ['PyTorch', 'ComfyUI', 'Gradio'], output: ['GLB'],
      local_status: 'local', license: 'Stability AI Community License', released: '2024-08',
      source_url: 'https://github.com/Stability-AI/stable-fast-3d', install_url: 'https://github.com/Stability-AI/stable-fast-3d',
      hardware_note: 'The official repository reports about 6 GB VRAM for a default image and experimental Apple Silicon support. It recommends CPU below 32 GB unified memory on Mac.',
      strengths: ['Fast reconstruction', 'Textured GLB output', 'CUDA, experimental MPS and CPU paths'],
      caveats: ['Gated model download', 'Community license conditions']
    },
    {
      id: 'hunyuan3d-2.1', name: 'Hunyuan3D 2.1', category: '3d', developer: 'Tencent Hunyuan',
      summary: 'Two-stage open image-to-3D pipeline for mesh geometry and texture generation.',
      tasks: ['image-to-3d', 'mesh-reconstruction', 'texturing'], platforms: ['windows', 'linux'],
      accelerators: ['nvidia'], min_ram_gb: 24, min_vram_gb: 6, runtime: ['PyTorch', 'ComfyUI', 'Local API'],
      output: ['GLB', 'OBJ'], local_status: 'local', license: 'Tencent Hunyuan community license', released: '2025-06',
      source_url: 'https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1', install_url: 'https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1',
      hardware_note: 'Geometry can run at a lower memory level. A complete textured pipeline needs more headroom, so 24 GB system RAM and 6 GB VRAM are treated as the entry floor.',
      strengths: ['Separate shape and texture stages', 'Local API server', 'GLB export'],
      caveats: ['CUDA-oriented', 'Texture stage increases memory and runtime']
    },
    {
      id: 'trellis-image-large', name: 'TRELLIS Image Large', category: '3d', developer: 'Microsoft Research',
      summary: 'High-quality image-to-3D generation producing meshes, radiance fields and 3D Gaussian assets.',
      tasks: ['image-to-3d', 'gaussian-splatting', 'mesh-generation'], platforms: ['linux'],
      accelerators: ['nvidia'], min_ram_gb: 32, min_vram_gb: 24, runtime: ['PyTorch'],
      output: ['GLB', 'PLY', '3D Gaussian'], local_status: 'local', license: 'MIT code, model terms apply', released: '2024-12',
      source_url: 'https://github.com/microsoft/TRELLIS', install_url: 'https://github.com/microsoft/TRELLIS',
      hardware_note: 'The official path is Linux plus NVIDIA CUDA. Twenty-four GB VRAM is a conservative workstation floor for the large pipeline.',
      strengths: ['Multiple 3D representations', 'Textured GLB export', 'Official pretrained pipeline'],
      caveats: ['Complex native dependencies', 'Linux and NVIDIA focus']
    },
    {
      id: 'trellis-2', name: 'TRELLIS.2 4B', category: '3d', developer: 'Microsoft Research',
      summary: 'High-resolution image-to-3D generation with complex topology and full PBR materials.',
      tasks: ['image-to-3d', 'pbr-texturing', 'mesh-generation'], platforms: ['linux'],
      accelerators: ['nvidia'], min_ram_gb: 64, min_vram_gb: 24, runtime: ['PyTorch'],
      output: ['Textured mesh', 'PBR materials'], local_status: 'local', license: 'MIT code, model terms apply', released: '2026-03',
      source_url: 'https://github.com/microsoft/TRELLIS.2', install_url: 'https://github.com/microsoft/TRELLIS.2',
      hardware_note: 'The official repository requires Linux and an NVIDIA GPU with at least 24 GB VRAM.',
      strengths: ['Complex topology', 'PBR material generation', 'High-resolution assets'],
      caveats: ['Workstation-class hardware', 'CUDA compilation and specialist dependencies']
    },
    {
      id: 'triposr', name: 'TripoSR', category: '3d', developer: 'Stability AI / Tripo AI',
      summary: 'Fast single-image 3D reconstruction designed for accessible local inference.',
      tasks: ['image-to-3d', 'mesh-reconstruction'], platforms: ['windows', 'linux'],
      accelerators: ['nvidia'], min_ram_gb: 16, min_vram_gb: 6, runtime: ['PyTorch', 'Gradio'],
      output: ['OBJ'], local_status: 'local', license: 'MIT code, model terms apply', released: '2024-03',
      source_url: 'https://github.com/VAST-AI-Research/TripoSR', install_url: 'https://github.com/VAST-AI-Research/TripoSR',
      hardware_note: 'A practical lightweight entry for CUDA machines. Texturing requires an additional pipeline.',
      strengths: ['Fast inference', 'Simple image-to-mesh workflow', 'Widely integrated'],
      caveats: ['Geometry only by default', 'Lower fidelity than newer multi-stage systems']
    },

    {
      id: 'flux-2-klein-4b', name: 'FLUX.2 Klein 4B', category: 'image', developer: 'Black Forest Labs',
      summary: 'Fast open image generation and multi-reference editing for consumer NVIDIA GPUs.',
      tasks: ['text-to-image', 'image-editing', 'multi-reference'], platforms: ['windows', 'linux'],
      accelerators: ['nvidia'], min_ram_gb: 16, min_vram_gb: 8, runtime: ['PyTorch', 'Diffusers'],
      output: ['PNG', 'JPEG'], local_status: 'local', license: 'Apache 2.0', released: '2026-01',
      source_url: 'https://github.com/black-forest-labs/flux2', install_url: 'https://github.com/black-forest-labs/flux2',
      hardware_note: 'The official 4B model is positioned for consumer hardware and approximately 8 GB VRAM.',
      strengths: ['Apache 2.0', 'Generation and editing', 'Consumer GPU target'], caveats: ['Official reference code is CUDA-first']
    },
    {
      id: 'flux-1-schnell', name: 'FLUX.1 Schnell', category: 'image', developer: 'Black Forest Labs',
      summary: 'Four-step open text-to-image model with Diffusers, ComfyUI and local inference support.',
      tasks: ['text-to-image'], platforms: ['windows', 'linux'], accelerators: ['nvidia'],
      min_ram_gb: 32, min_vram_gb: 16, runtime: ['Diffusers', 'ComfyUI', 'PyTorch'], output: ['PNG', 'JPEG'],
      local_status: 'local', license: 'Apache 2.0', released: '2024-08',
      source_url: 'https://github.com/black-forest-labs/flux', install_url: 'https://github.com/black-forest-labs/flux',
      hardware_note: 'CPU offloading and quantized runtimes can lower VRAM needs. Sixteen GB is a conservative local floor for a usable workflow.',
      strengths: ['Fast four-step generation', 'Apache 2.0', 'Large runtime ecosystem'], caveats: ['Large text encoder and model download']
    },
    {
      id: 'stable-diffusion-3.5-medium', name: 'Stable Diffusion 3.5 Medium', category: 'image', developer: 'Stability AI',
      summary: 'General text-to-image foundation model with official local inference and broad tooling support.',
      tasks: ['text-to-image', 'controlnet'], platforms: ['windows', 'linux'], accelerators: ['nvidia'],
      min_ram_gb: 24, min_vram_gb: 12, runtime: ['PyTorch', 'Diffusers', 'ComfyUI'], output: ['PNG', 'JPEG'],
      local_status: 'local', license: 'Stability AI Community License', released: '2024-10',
      source_url: 'https://github.com/Stability-AI/sd3.5', install_url: 'https://github.com/Stability-AI/sd3.5',
      hardware_note: 'The medium model is the practical local variant. Exact memory depends on text encoder offloading and precision.',
      strengths: ['Mature local ecosystem', 'ControlNet support', 'Strong general image quality'], caveats: ['Community license conditions']
    },
    {
      id: 'qwen-image-2512', name: 'Qwen Image 2512', category: 'image', developer: 'Qwen Team',
      summary: 'Open image generation model focused on complex text rendering, realism and precise editing.',
      tasks: ['text-to-image', 'image-editing', 'text-rendering'], platforms: ['linux'], accelerators: ['nvidia'],
      min_ram_gb: 32, min_vram_gb: 24, runtime: ['Diffusers', 'SGLang', 'PyTorch'], output: ['PNG', 'JPEG'],
      local_status: 'local', license: 'Apache 2.0', released: '2025-12',
      source_url: 'https://github.com/QwenLM/Qwen-Image', install_url: 'https://github.com/QwenLM/Qwen-Image',
      hardware_note: 'The official Diffusers path is local but workstation-oriented. Quantization can lower the memory floor.',
      strengths: ['Strong text rendering', 'Generation and editing', 'Official Diffusers pipeline'], caveats: ['Large workstation model']
    },
    {
      id: 'sdxl-base-1.0', name: 'Stable Diffusion XL Base', category: 'image', developer: 'Stability AI',
      summary: 'Mature local image model with one of the broadest ComfyUI and fine-tuning ecosystems.',
      tasks: ['text-to-image', 'image-to-image', 'inpainting'], platforms: ['macos', 'windows', 'linux'],
      accelerators: ['apple-silicon', 'nvidia', 'amd'], min_ram_gb: 16, min_vram_gb: 8,
      runtime: ['Diffusers', 'ComfyUI', 'Draw Things'], output: ['PNG', 'JPEG'], local_status: 'local',
      license: 'CreativeML Open RAIL++-M', released: '2023-07', source_url: 'https://github.com/Stability-AI/generative-models',
      install_url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
      hardware_note: 'Eight GB VRAM is a common practical floor. Apple Silicon and AMD support depend on the selected runtime.',
      strengths: ['Very mature ecosystem', 'Many local runtimes', 'Large adapter and ControlNet library'], caveats: ['Older than current frontier models']
    },

    {
      id: 'ace-step-1.5', name: 'ACE-Step 1.5', category: 'music', developer: 'ACE-Step Team',
      summary: 'Local music generation for songs, remixes, repainting and lyric-conditioned workflows.',
      tasks: ['text-to-music', 'lyrics-to-song', 'remix', 'audio-repainting'], platforms: ['windows', 'linux'],
      accelerators: ['nvidia'], min_ram_gb: 16, min_vram_gb: 8, runtime: ['Local server', 'ComfyUI', 'PyTorch'],
      output: ['WAV', 'MP3', 'FLAC'], local_status: 'local', license: 'Apache 2.0', released: '2026-03',
      source_url: 'https://github.com/ace-step/ACE-Step-1.5', install_url: 'https://github.com/ace-step/ACE-Step-1.5',
      hardware_note: 'Local mode requires a capable GPU. Eight GB VRAM is treated as the entry tier for optimized generation.',
      strengths: ['Full-song workflow', 'Local server and ComfyUI', 'Lyrics and remix controls'], caveats: ['Generation quality and duration depend on memory']
    },
    {
      id: 'yue', name: 'YuE', category: 'music', developer: 'HKUST / M-A-P',
      summary: 'Open lyrics-to-song foundation model for multi-minute songs with vocals and accompaniment.',
      tasks: ['lyrics-to-song', 'music-continuation', 'style-conditioning'], platforms: ['windows', 'linux'],
      accelerators: ['nvidia'], min_ram_gb: 32, min_vram_gb: 8, runtime: ['PyTorch', 'YuE UI'], output: ['WAV'],
      local_status: 'local', license: 'Apache 2.0 with attribution request', released: '2025-01',
      source_url: 'https://github.com/multimodal-art-projection/YuE', install_url: 'https://github.com/multimodal-art-projection/YuE',
      hardware_note: 'The official project points to quantized community UI workflows capable of running with 8 GB VRAM.',
      strengths: ['Multi-minute songs', 'Vocals and accompaniment', 'Multilingual lyrics'], caveats: ['Slow generation', 'Care is needed with voice and style references']
    },
    {
      id: 'musicgen-small', name: 'MusicGen Small', category: 'music', developer: 'Meta AI',
      summary: 'Compact text-to-music model from AudioCraft for short instrumental generations.',
      tasks: ['text-to-music'], platforms: ['windows', 'linux'], accelerators: ['nvidia'],
      min_ram_gb: 16, min_vram_gb: 8, runtime: ['AudioCraft', 'Transformers'], output: ['WAV'],
      local_status: 'local', license: 'CC BY-NC 4.0 weights', released: '2023-06',
      source_url: 'https://github.com/facebookresearch/audiocraft', install_url: 'https://github.com/facebookresearch/audiocraft',
      hardware_note: 'The small 300M model can run on smaller GPUs than the 16 GB recommendation for medium models.',
      strengths: ['Compact', 'Simple text conditioning', 'Mature AudioCraft code'], caveats: ['Non-commercial weights', 'Short-form generation']
    },
    {
      id: 'musicgen-medium', name: 'MusicGen Medium', category: 'music', developer: 'Meta AI',
      summary: 'Higher-quality text-to-music and melody-conditioned generation through AudioCraft.',
      tasks: ['text-to-music', 'melody-to-music'], platforms: ['windows', 'linux'], accelerators: ['nvidia'],
      min_ram_gb: 24, min_vram_gb: 16, runtime: ['AudioCraft'], output: ['WAV'], local_status: 'local',
      license: 'CC BY-NC 4.0 weights', released: '2023-06', source_url: 'https://github.com/facebookresearch/audiocraft',
      install_url: 'https://github.com/facebookresearch/audiocraft',
      hardware_note: 'AudioCraft officially recommends at least 16 GB GPU memory for the medium 1.5B models.',
      strengths: ['Text and melody conditioning', 'Good quality-to-compute balance'], caveats: ['Non-commercial weights', 'GPU required by the official local path']
    },
    {
      id: 'stable-audio-open', name: 'Stable Audio Open', category: 'music', developer: 'Stability AI',
      summary: 'Open local generation for short music samples, sound effects and production elements.',
      tasks: ['text-to-audio', 'sound-effects', 'music-samples'], platforms: ['windows', 'linux'],
      accelerators: ['nvidia'], min_ram_gb: 24, min_vram_gb: 12, runtime: ['stable-audio-tools', 'ComfyUI'],
      output: ['WAV'], local_status: 'local', license: 'Stability AI Community License', released: '2024-06',
      source_url: 'https://github.com/Stability-AI/stable-audio-tools', install_url: 'https://github.com/Stability-AI/stable-audio-tools',
      hardware_note: 'A CUDA GPU is the practical path. Memory varies with sample duration and precision.',
      strengths: ['Sound effects and samples', 'Official local Gradio path', 'Training and fine-tuning tools'], caveats: ['Short audio focus', 'Community license conditions']
    },

    {
      id: 'paddleocr-vl-1.6', name: 'PaddleOCR-VL 1.6', category: 'vision', developer: 'PaddlePaddle',
      summary: 'Local document parsing, OCR, layout recognition and structured extraction across many hardware backends.',
      tasks: ['ocr', 'document-understanding', 'layout-analysis'], platforms: ['macos', 'windows', 'linux'],
      accelerators: ['apple-silicon', 'nvidia', 'amd', 'cpu'], min_ram_gb: 16, min_vram_gb: 8,
      runtime: ['PaddlePaddle', 'Transformers', 'MLX-VLM', 'llama.cpp'], output: ['Markdown', 'JSON', 'DOCX'],
      local_status: 'local', license: 'Apache 2.0', released: '2026-05', source_url: 'https://github.com/PaddlePaddle/PaddleOCR',
      install_url: 'https://github.com/PaddlePaddle/PaddleOCR',
      hardware_note: 'Official documentation covers CPU, NVIDIA, AMD, Intel and Apple Silicon paths. Backend support varies by platform.',
      strengths: ['Broad hardware matrix', 'Document-first outputs', 'Offline deployment'], caveats: ['Backend compatibility is complex']
    },
    {
      id: 'florence-2-base', name: 'Florence-2 Base', category: 'vision', developer: 'Microsoft',
      summary: 'Compact general vision model for captioning, OCR, detection, segmentation and grounding.',
      tasks: ['image-captioning', 'ocr', 'object-detection', 'segmentation'], platforms: ['macos', 'windows', 'linux'],
      accelerators: ['apple-silicon', 'nvidia', 'cpu'], min_ram_gb: 8, min_vram_gb: 4,
      runtime: ['Transformers', 'ONNX'], output: ['Text', 'Bounding boxes', 'Masks'], local_status: 'local',
      license: 'MIT', released: '2024-06', source_url: 'https://huggingface.co/microsoft/Florence-2-base',
      install_url: 'https://huggingface.co/microsoft/Florence-2-base',
      hardware_note: 'The compact base checkpoint is suitable for modest local hardware through Transformers or optimized runtimes.',
      strengths: ['Many vision tasks', 'Compact checkpoint', 'MIT license'], caveats: ['Task prompts require exact formatting']
    },
    {
      id: 'moondream-2', name: 'Moondream 2', category: 'vision', developer: 'Moondream',
      summary: 'Small vision-language model designed for local image understanding and edge deployment.',
      tasks: ['visual-question-answering', 'image-captioning', 'object-detection'], platforms: ['macos', 'windows', 'linux'],
      accelerators: ['apple-silicon', 'nvidia', 'cpu'], min_ram_gb: 8, min_vram_gb: 4,
      runtime: ['Transformers', 'ONNX', 'MLX'], output: ['Text', 'Bounding boxes'], local_status: 'local',
      license: 'Apache 2.0', released: '2024-06', source_url: 'https://github.com/moondream-ai/moondream',
      install_url: 'https://github.com/moondream-ai/moondream',
      hardware_note: 'Designed as a compact local vision model. Four GB accelerator memory or eight GB system memory is a conservative entry tier.',
      strengths: ['Small and fast', 'Edge-friendly', 'Simple local API'], caveats: ['Lower ceiling than large VLMs']
    },
    {
      id: 'qwen2.5-vl-3b', name: 'Qwen2.5-VL 3B', category: 'vision', developer: 'Qwen Team',
      summary: 'Compact multimodal model for images, documents, charts and video understanding.',
      tasks: ['visual-question-answering', 'document-understanding', 'video-understanding'], platforms: ['macos', 'windows', 'linux'],
      accelerators: ['apple-silicon', 'nvidia'], min_ram_gb: 16, min_vram_gb: 8,
      runtime: ['Transformers', 'MLX-VLM', 'llama.cpp'], output: ['Text', 'JSON'], local_status: 'local',
      license: 'Apache 2.0', released: '2025-02', source_url: 'https://github.com/QwenLM/Qwen2.5-VL',
      install_url: 'https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct',
      hardware_note: 'Quantized MLX and llama.cpp paths make the 3B checkpoint practical on 16 GB machines.',
      strengths: ['Images, documents and video', 'Strong multilingual understanding', 'Several local runtimes'], caveats: ['Video inputs increase memory use']
    },
    {
      id: 'smolvlm2-2.2b', name: 'SmolVLM2 2.2B', category: 'vision', developer: 'Hugging Face',
      summary: 'Compact vision-language model for image and video understanding on local hardware.',
      tasks: ['image-captioning', 'visual-question-answering', 'video-understanding'], platforms: ['macos', 'windows', 'linux'],
      accelerators: ['apple-silicon', 'nvidia', 'cpu'], min_ram_gb: 8, min_vram_gb: 4,
      runtime: ['Transformers', 'MLX-VLM', 'ONNX'], output: ['Text'], local_status: 'local',
      license: 'Apache 2.0', released: '2025-02', source_url: 'https://huggingface.co/HuggingFaceTB/SmolVLM2-2.2B-Instruct',
      install_url: 'https://huggingface.co/HuggingFaceTB/SmolVLM2-2.2B-Instruct',
      hardware_note: 'The 2.2B checkpoint is intended for compact deployment and can run on modest local machines with optimized precision.',
      strengths: ['Compact', 'Image and video input', 'Broad Transformers support'], caveats: ['Smaller reasoning capacity than large VLMs']
    }
  ];

  root.LOCAL_AI_CATALOG = models;
})(typeof window !== 'undefined' ? window : globalThis);
