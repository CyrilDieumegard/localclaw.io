const DIY_VERIFIED_DATE = '2026-08-30';

const projects = [
  {
    slug: 'needle-2-esp32-s3',
    title: 'Run Needle 2 on an ESP32-S3',
    cardTitle: 'Needle 2 on ESP32-S3',
    summary: 'Run a 14 MB tool-calling model completely offline on a microcontroller, then turn plain-English requests into LED actions.',
    outcome: 'An offline ESP32-S3 demo that maps natural-language requests to schema-valid tool calls and drives the board\'s RGB LED.',
    image: '/images/diy/needle-2-esp32-s3.png',
    imageAlt: 'ESP32-S3 development board on a dark maker workbench with its RGB LED illuminated',
    difficulty: 'Intermediate',
    budget: 'Board from about $10',
    duration: '1–2 hours after ESP-IDF setup',
    seo: {
      title: 'Run Needle 2 on ESP32-S3: Step-by-Step DIY Guide | LocalClaw',
      description: 'Build a fully offline 14 MB tool-calling AI on an ESP32-S3 N16R8. Exact hardware, original video, commands, testing and troubleshooting.'
    },
    topics: ['Offline AI', 'ESP32-S3', 'Tool calling'],
    status: ['Creator demonstrated', 'LocalClaw source-reviewed'],
    localClawTested: false,
    creator: {
      displayName: 'Better Stack',
      url: 'https://www.youtube.com/@betterstack',
      implementationName: 'Andris Gauracs',
      implementationUrl: 'https://github.com/andrisgauracs',
      note: 'Better Stack published the original demonstration. Andris Gauracs built and documented the independent ESP32-S3 inference implementation.'
    },
    model: {
      name: 'Needle 2',
      author: 'Cactus Compute',
      url: 'https://www.cactuscompute.com/needle',
      weightsUrl: 'https://huggingface.co/Cactus-Compute/needle2',
      license: 'Apache-2.0',
      parameters: '45M',
      binarySize: '13.7 MB download / about 14 MB',
      purpose: 'Tool calling, device actions and structured extraction — not general chat'
    },
    video: {
      id: 'M24yg6ZM7-I',
      title: 'I Can\'t Believe This AI Model Fits in 14 Megabytes (Needle 2)',
      url: 'https://www.youtube.com/watch?v=M24yg6ZM7-I',
      embedUrl: 'https://www.youtube-nocookie.com/embed/M24yg6ZM7-I?rel=0&cc_load_policy=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/M24yg6ZM7-I/maxresdefault.jpg',
      uploadDate: '2026-08-17T18:30:10-07:00',
      duration: 'PT9M53S',
      durationLabel: '9:53'
    },
    repository: {
      name: 'andrisgauracs/needle-2-esp32',
      url: 'https://github.com/andrisgauracs/needle-2-esp32',
      license: 'Apache-2.0',
      reviewedCommit: '61cafad7014a5664bb3ffd5f0c457ce5aa6598ae'
    },
    page: {
      about: ['Needle 2', 'ESP32-S3', 'offline AI', 'tool calling', 'edge AI'],
      howToTime: 'PT2H',
      estimatedCost: { currency: 'USD', value: '10-25' },
      tools: ['ESP-IDF 5.5+', 'Python 3', 'CMake', 'Git'],
      hardwareFact: { title: 'ESP32-S3 N16R8', detail: '16 MB flash · 8 MB octal PSRAM' },
      purposeFact: { title: 'Offline tool calling', detail: 'Device actions, not general chat' },
      videoTitle: 'Watch Better Stack build it',
      videoIntro: 'The original video remains attached to the project. Playback uses YouTube\'s privacy-enhanced player and starts only after you choose to play it.',
      compatibilityLabel: 'Compatibility gate',
      compatibilityTitle: 'N16R8 is not optional',
      compatibilityText: 'A generic ESP32-S3 listing is not enough. The reference implementation requires 16 MB flash and 8 MB octal PSRAM. A 2 MB or quad-PSRAM board will not run this documented build.',
      verificationText: 'LocalClaw checked these requirements and commands against the creator\'s repository at the reviewed commit and Cactus Compute\'s model page.',
      partsTitle: 'Buy the compatible hardware',
      guideTitle: 'Build Needle 2 on ESP32-S3',
      guideIntro: 'Commands are preserved where technical accuracy requires it; the explanations, order and checks are independently organized by LocalClaw from the cited primary sources.',
      performanceTitle: 'Slow, local and purposeful',
      performanceIntro: 'The documented ESP32-S3 port is compute-bound, so treat it as an offline device-action demo rather than a conversational assistant.',
      secondaryTitle: 'Replace the tool, not the model',
      secondaryText: 'The repository lets you describe another tool in JSON, write a hardware handler and register it in the firmware. That is the path to servos, relays and sensor actions.',
      secondaryLinkLabel: 'Read the creator\'s customization notes',
      secondaryLinkUrl: 'https://github.com/andrisgauracs/needle-2-esp32#using-your-own-tools',
      troubleshootingIntro: 'The reference repository documents several silent configuration failures. Check these before changing the inference engine.',
      licenseNote: 'The ESP32 implementation and Needle 2 materials cited here identify Apache 2.0 licensing. LocalClaw links to the original repositories and does not redistribute their source code or model binary on this page.',
      faqTitle: 'Needle 2 ESP32-S3 FAQ',
      sourceCta: 'Open source code'
    },
    requirements: [
      { label: 'Chip', value: 'ESP32-S3, dual-core Xtensa LX7' },
      { label: 'Flash', value: '16 MB required; the model alone needs about 13.1 MB' },
      { label: 'PSRAM', value: '8 MB octal PSRAM; N16R8-class board required' },
      { label: 'LED', value: 'Onboard WS2812 RGB LED on GPIO48 for the supplied demo' },
      { label: 'Console', value: 'UART bridge USB port' },
      { label: 'Software', value: 'ESP-IDF 5.5+, Python 3, CMake and Git' }
    ],
    parts: [
      {
        name: 'ESP32-S3 N16R8 development board',
        requirement: 'Required',
        description: 'Verify the listing explicitly states 16 MB flash and 8 MB octal PSRAM. A generic ESP32-S3 label is not enough.',
        amazonQuery: 'ESP32-S3 DevKitC-1 N16R8 16MB flash 8MB PSRAM'
      },
      {
        name: 'USB-C data cable',
        requirement: 'Required if not included',
        description: 'Use a cable that carries data, not a charge-only cable. The build and serial console both depend on USB data.',
        amazonQuery: 'USB C data cable ESP32 development board'
      },
      {
        name: 'Breadboard and jumper-wire kit',
        requirement: 'Optional',
        description: 'The onboard RGB LED is enough for the supplied demo. Add a breadboard and jumpers when adapting the tool call to sensors or servos.',
        amazonQuery: 'electronics breadboard jumper wire kit ESP32'
      }
    ],
    steps: [
      {
        title: 'Confirm the exact board before buying',
        summary: 'The reference port targets one N16R8-class ESP32-S3 board. Confirm 16 MB flash, 8 MB octal PSRAM, and an onboard WS2812 LED on GPIO48.',
        checks: ['Reject 2 MB PSRAM variants.', 'Reject listings that do not identify flash and PSRAM capacity.', 'Do not assume every ESP32-S3 DevKit is compatible.']
      },
      {
        title: 'Install the host prerequisites',
        summary: 'Install ESP-IDF 5.5 or newer, Python 3, CMake and Git. Complete Espressif\'s normal toolchain setup before continuing.',
        links: [{ label: 'ESP-IDF installation guide', url: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/' }]
      },
      {
        title: 'Clone the creator\'s implementation',
        summary: 'Work from the Apache-2.0 repository used in the original demonstration.',
        commands: [
          'git clone https://github.com/andrisgauracs/needle-2-esp32.git',
          'cd needle-2-esp32'
        ]
      },
      {
        title: 'Create the Python environment',
        summary: 'The helper tools use NumPy, Rich, PySerial, Hugging Face Hub and SentencePiece.',
        commands: [
          'python3 -m venv .venv',
          '.venv/bin/pip install numpy rich pyserial huggingface_hub sentencepiece'
        ]
      },
      {
        title: 'Download the Needle 2 model',
        summary: 'Fetch the official Cactus Compute .cact binary into a local model directory. The model is downloaded from Hugging Face and is not stored in the ESP32 repository.',
        commands: [
          'mkdir -p model',
          '.venv/bin/python -c "from huggingface_hub import hf_hub_download; import shutil; shutil.copy(hf_hub_download(\'Cactus-Compute/needle2\', \'needle2.cact\'), \'model/needle2.cact\')"'
        ]
      },
      {
        title: 'Build and rehearse the host engine',
        summary: 'Compile the desktop reference engine first. This catches host-side setup problems before the slower microcontroller flash cycle.',
        commands: [
          'cmake -S host -B build -DCMAKE_BUILD_TYPE=Release',
          'cmake --build build -j8',
          '.venv/bin/python tools/needle_tui.py --local'
        ]
      },
      {
        title: 'Build and flash the ESP32-S3 firmware',
        summary: 'Load your ESP-IDF environment, target ESP32-S3, build the firmware, then replace the sample serial port with the port shown on your machine.',
        commands: [
          '. /path/to/esp-idf/export.sh',
          'cd esp32/needle_demo',
          'idf.py set-target esp32s3',
          'idf.py build',
          'idf.py -p /dev/cu.usbmodemXXXX flash'
        ],
        note: 'On Linux, the serial port is commonly /dev/ttyUSB0 or /dev/ttyACM0. On macOS, list candidates with ls /dev/cu.usb*.'
      },
      {
        title: 'Write the model to its flash partition',
        summary: 'Return to the repository root and write the model binary at the partition offset used by the reference project.',
        commands: [
          'cd ../..',
          'esptool.py --chip esp32s3 -p /dev/cu.usbmodemXXXX -b 921600 write_flash 0x210000 model/needle2.cact'
        ],
        note: 'The model flash takes roughly three minutes in the creator\'s documented setup and only needs repeating when the model changes.'
      },
      {
        title: 'Run the terminal interface and test an action',
        summary: 'Start the serial TUI, wait for the one-time prompt priming, then ask for an LED action in natural language.',
        commands: [
          '.venv/bin/python tools/needle_tui.py --serial /dev/cu.usbmodemXXXX'
        ],
        prompts: ['Flash a red light for 3 seconds.', 'Shine a purple light for 7 seconds.', 'What is the capital of France?'],
        note: 'The final prompt is intentionally outside the tool schema. A correct result is an empty tool call rather than a chatbot answer.'
      }
    ],
    performance: [
      { label: 'Decode', value: '1.87 tokens/second on the documented 240 MHz board' },
      { label: 'Reasoning off', value: 'about 25 seconds per request' },
      { label: 'Reasoning on', value: 'about 47 seconds per request' },
      { label: 'First boot prime', value: 'about 51 seconds' }
    ],
    troubleshooting: [
      {
        problem: 'No serial output',
        fix: 'Use the UART bridge USB port and leave the ESP-IDF console selection at its default. Enabling USB-Serial/JTAG for the console can make the program appear silent.'
      },
      {
        problem: 'Boot loop or PSRAM error',
        fix: 'Confirm the board has 8 MB octal PSRAM and that CONFIG_SPIRAM_MODE_OCT=y plus CONFIG_SPIRAM_SPEED_80M=y are active.'
      },
      {
        problem: 'Inference is roughly 1.5× slower',
        fix: 'Check that CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y is applied. ESP-IDF may otherwise default the ESP32-S3 to 160 MHz.'
      },
      {
        problem: 'The model chooses the wrong action',
        fix: 'Needle 2 is constrained by the tool schema and its descriptions. Make field descriptions short and explicit, and remember that it is a dispatcher rather than a general chatbot.'
      }
    ],
    faq: [
      { question: 'Can Needle 2 run on any ESP32-S3 board?', answer: 'No. This port requires an N16R8-class ESP32-S3 with 16 MB flash and 8 MB octal PSRAM. Smaller or quad-PSRAM variants are not compatible with the documented build.' },
      { question: 'Is Needle 2 a tiny offline chatbot?', answer: 'No. Needle 2 is trained for tool calling, device actions and structured extraction. It selects a declared function and fills its arguments; it is not trained for general conversation or world knowledge.' },
      { question: 'Does the demo need Wi-Fi or a cloud API?', answer: 'No. Inference and the LED action run locally on the microcontroller. Internet access is needed during setup to download the source dependencies and model binary.' },
      { question: 'How fast is Needle 2 on ESP32-S3?', answer: 'The documented board reaches about 1.87 tokens per second. Requests take about 25 seconds without reasoning and about 47 seconds with reasoning.' },
      { question: 'Can I replace the LED with a servo or another device?', answer: 'Yes. The repository documents a three-part customization flow: describe the tool schema, write a device handler and register that handler in the firmware.' }
    ],
    sources: [
      { label: 'Original Better Stack video', url: 'https://www.youtube.com/watch?v=M24yg6ZM7-I', type: 'Video' },
      { label: 'ESP32-S3 implementation by Andris Gauracs', url: 'https://github.com/andrisgauracs/needle-2-esp32', type: 'Source code' },
      { label: 'Needle 2 official model page', url: 'https://www.cactuscompute.com/needle', type: 'Model documentation' },
      { label: 'Needle 2 model weights', url: 'https://huggingface.co/Cactus-Compute/needle2', type: 'Weights' },
      { label: 'ESP-IDF documentation', url: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/', type: 'Toolchain' }
    ]
  },
  {
    slug: 'falcon-h1-raspberry-pi-1',
    title: 'Run Falcon-H1 Tiny on Raspberry Pi 1 B+',
    cardTitle: 'Falcon-H1 Tiny on Raspberry Pi 1 B+',
    summary: 'Run a 90M-parameter language model offline on a 2014 Raspberry Pi with one ARMv6 core and only 512 MB of RAM.',
    outcome: 'A source-reviewed vintage-hardware experiment that cross-compiles llama.cpp for ARMv6 and runs Falcon-H1 Tiny entirely offline on a Raspberry Pi 1 Model B+.',
    image: '/images/diy/falcon-h1-raspberry-pi-1.png',
    imageAlt: 'Raspberry Pi 1 Model B Plus on a dark maker workbench with Ethernet cable and red status LED',
    difficulty: 'Advanced',
    budget: 'Vintage board · availability varies',
    duration: '2–4 hours including cross-compilation',
    seo: {
      title: 'Run Falcon-H1 Tiny on Raspberry Pi 1 B+: DIY Guide | LocalClaw',
      description: 'Run a 90M Falcon-H1 Tiny GGUF on a 2014 Raspberry Pi 1 B+ with 512 MB RAM. ARMv6 cross-compile, exact parts, commands and honest results.'
    },
    topics: ['Vintage hardware', 'ARMv6', 'Offline LLM'],
    status: ['Creator demonstrated', 'LocalClaw source-reviewed'],
    localClawTested: false,
    creator: {
      displayName: 'Better Stack',
      url: 'https://www.youtube.com/@betterstack',
      note: 'Better Stack published and demonstrated the original Raspberry Pi experiment. LocalClaw independently structured this guide from the video and the cited Raspberry Pi, TII, llama.cpp and Dockcross primary sources.'
    },
    model: {
      name: 'Falcon-H1 Tiny 90M Instruct',
      author: 'Technology Innovation Institute',
      url: 'https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF',
      weightsUrl: 'https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF',
      license: 'Falcon-LLM License',
      parameters: '90M',
      binarySize: '57.2 MB for the recommended Q4_0 GGUF',
      purpose: 'Experimental offline text generation on extreme low-end hardware — not reliable factual assistance'
    },
    video: {
      id: 'u8XQsL38WjQ',
      title: 'I Ran a Local LLM on 12-Year-Old Raspberry Pi (It Actually Worked!)',
      url: 'https://www.youtube.com/watch?v=u8XQsL38WjQ',
      embedUrl: 'https://www.youtube-nocookie.com/embed/u8XQsL38WjQ?rel=0&cc_load_policy=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/u8XQsL38WjQ/maxresdefault.jpg',
      uploadDate: '2026-05-11T01:30:26-07:00',
      duration: 'PT10M10S',
      durationLabel: '10:10'
    },
    repository: {
      name: 'ggml-org/llama.cpp',
      url: 'https://github.com/ggml-org/llama.cpp',
      license: 'MIT',
      reviewedCommit: '1ec7ba0c14f33f17e980daeeda5f35b225d41994'
    },
    page: {
      about: ['Falcon-H1 Tiny', 'Raspberry Pi 1 Model B+', 'ARMv6', 'offline LLM', 'vintage computing'],
      howToTime: 'PT4H',
      tools: ['Docker on an x86_64 host', 'Dockcross linux-armv6', 'llama.cpp', 'Raspberry Pi Imager', 'SSH'],
      hardwareFact: { title: 'Raspberry Pi 1 B+', detail: 'BCM2835 · 512 MB RAM · ARMv6' },
      purposeFact: { title: 'Experimental offline LLM', detail: 'Educational proof, not a daily assistant' },
      videoTitle: 'Watch Better Stack push ARMv6 to its limit',
      videoIntro: 'The original experiment stays attached to the guide. Playback uses YouTube\'s privacy-enhanced player and starts only after you choose to play it.',
      compatibilityLabel: 'Vintage hardware gate',
      compatibilityTitle: 'This guide is specifically for Raspberry Pi 1 B+',
      compatibilityText: 'The documented target is the 2014 Model B+ with a BCM2835, 512 MB RAM and ARMv6 userland. It has Ethernet but no onboard Wi-Fi. Newer Raspberry Pi models need a different build target and will not follow this exact path.',
      verificationText: 'LocalClaw reviewed the build flags against llama.cpp commit 1ec7ba0c14f33f17e980daeeda5f35b225d41994 from the video publication date, Dockcross\'s ARMv6 toolchain, TII\'s official GGUF files and Raspberry Pi\'s hardware documentation.',
      partsTitle: 'Assemble the vintage setup',
      guideTitle: 'Cross-compile and run Falcon-H1 Tiny',
      guideIntro: 'Better Stack did not publish a companion repository or command transcript. LocalClaw reconstructed this source-reviewed path from the demonstrated method and pins the reviewed llama.cpp commit for reproducibility.',
      performanceTitle: 'It runs — and exposes the trade-offs',
      performanceIntro: 'The creator showed successful offline inference, but output is extremely slow and factual reliability is weak. Treat the result as a systems experiment.',
      secondaryTitle: 'Q4_0 is the sensible starting point',
      secondaryText: 'The official model repository offers many quantizations. The creator avoided newer IQ formats on ARMv6 and found the legacy Q4 path the best balance of memory, coherence and simple operations for this CPU.',
      secondaryLinkLabel: 'Open the official GGUF files',
      secondaryLinkUrl: 'https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF/tree/main',
      troubleshootingIntro: 'Most failures come from targeting the wrong ARM generation, using a modern instruction set, or exhausting the Pi\'s small 32-bit address space.',
      licenseNote: 'llama.cpp is MIT-licensed. Falcon-H1 Tiny uses the Falcon-LLM License, not Apache 2.0 or MIT. Review TII\'s terms before redistribution or commercial use; LocalClaw does not redistribute the model or runtime.',
      faqTitle: 'Falcon-H1 Tiny on Raspberry Pi 1 FAQ',
      sourceCta: 'Open llama.cpp'
    },
    requirements: [
      { label: 'Board', value: 'Raspberry Pi 1 Model B+ with BCM2835 and 512 MB RAM' },
      { label: 'Architecture', value: '32-bit ARMv6; confirm uname -m reports armv6l' },
      { label: 'Network', value: '100 Mb/s Ethernet; no onboard Wi-Fi' },
      { label: 'Storage', value: '8 GB or larger microSD card with Raspberry Pi OS Lite 32-bit' },
      { label: 'Power', value: 'Stable 5 V micro-USB supply' },
      { label: 'Build host', value: 'Docker-capable x86_64 computer; Dockcross publishes x86_64 images' }
    ],
    parts: [
      {
        name: 'Raspberry Pi 1 Model B+ 512 MB',
        requirement: 'Required',
        description: 'Confirm the listing says Model B+ and 512 MB. Vintage stock and used-board availability vary; do not substitute a Pi Zero or assume a newer Pi follows the same ARMv6 guide.',
        amazonQuery: 'Raspberry Pi 1 Model B Plus 512MB'
      },
      {
        name: '16 GB microSD card',
        requirement: 'Required',
        description: 'Raspberry Pi OS Lite and the sub-100 MB model fit easily, but a reputable 16 GB card gives useful headroom for setup and logs.',
        amazonQuery: '16GB microSD card A1 Raspberry Pi'
      },
      {
        name: '5 V 2 A micro-USB power supply',
        requirement: 'Required',
        description: 'Use a stable micro-USB supply made for Raspberry Pi-era boards. The Pi 1 B+ does not use USB-C power.',
        amazonQuery: '5V 2A micro USB power supply Raspberry Pi'
      },
      {
        name: 'Ethernet cable',
        requirement: 'Required for the documented setup',
        description: 'The Model B+ has 100 Mb/s Ethernet and no onboard Wi-Fi. Wired networking is the simplest reliable path for SSH and file transfer.',
        amazonQuery: 'Cat6 Ethernet cable 1 meter'
      }
    ],
    steps: [
      {
        title: 'Confirm the board and the build-host architecture',
        summary: 'Use a real Raspberry Pi 1 Model B+ and a separate Docker host. Dockcross documents linux-armv6 for Raspberry Pi, but its published images require an x86_64 host.',
        checks: ['The Pi board has four USB 2.0 ports, Ethernet, microSD and micro-USB power.', 'Plan to use Ethernet unless you already own a compatible USB Wi-Fi adapter.', 'On Apple Silicon, Docker may need x86_64 emulation; this guide does not claim that emulation path is reproduced.']
      },
      {
        title: 'Flash Raspberry Pi OS Lite 32-bit',
        summary: 'Use Raspberry Pi Imager to install the 32-bit Lite image. Preconfigure a hostname, user and SSH, then boot the Pi with Ethernet connected.',
        links: [{ label: 'Download Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/' }],
        note: 'The Model B+ has no onboard Wi-Fi. Raspberry Pi Imager can store wireless settings, but they only help if you add a compatible USB Wi-Fi adapter.'
      },
      {
        title: 'Clone and pin the reviewed llama.cpp source',
        summary: 'Pin the llama.cpp revision reviewed against the video publication date so later upstream changes do not silently alter the build.',
        commands: [
          'git clone https://github.com/ggml-org/llama.cpp.git',
          'cd llama.cpp',
          'git checkout 1ec7ba0c14f33f17e980daeeda5f35b225d41994'
        ]
      },
      {
        title: 'Create the ARMv6 Dockcross wrapper',
        summary: 'Dockcross provides the Raspberry Pi ARMv6 + VFP2 toolchain. Generate its local wrapper script from the official container image.',
        commands: [
          'docker run --rm dockcross/linux-armv6 > ./dockcross-linux-armv6',
          'chmod +x ./dockcross-linux-armv6'
        ],
        links: [{ label: 'Dockcross linux-armv6 documentation', url: 'https://github.com/dockcross/dockcross#dockcrosslinux-armv6' }]
      },
      {
        title: 'Configure a lean ARMv6 build',
        summary: 'Disable host-native tuning, shared libraries and OpenMP, then explicitly target ARMv6. The Dockcross image supplies the ARMv6 hard-float/VFP2 toolchain; no NEON target is enabled.',
        commands: [
          './dockcross-linux-armv6 cmake -S . -B build-armv6 -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF -DGGML_OPENMP=OFF -DGGML_CPU_ARM_ARCH=armv6',
          './dockcross-linux-armv6 cmake --build build-armv6 --target llama-completion -j2'
        ],
        note: 'LocalClaw source-reviewed these flags and the llama-completion target, but did not execute the cross-build because no Docker daemon or Raspberry Pi 1 hardware was available in the validation environment.'
      },
      {
        title: 'Download the recommended legacy Q4_0 model',
        summary: 'Start with TII\'s official Q4_0 file. It is 57.2 MB and uses the simpler legacy 4-bit format highlighted by the creator for ARMv6.',
        commands: [
          'mkdir -p models',
          'curl -L --fail --output models/Falcon-H1-Tiny-90M-Instruct-Q4_0.gguf https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF/resolve/main/Falcon-H1-Tiny-90M-Instruct-Q4_0.gguf'
        ]
      },
      {
        title: 'Boot the Pi and verify ARMv6',
        summary: 'Connect over SSH, verify the architecture and create a clean project directory before copying the binary and model.',
        commands: [
          'ssh pi@raspberrypi.local',
          'uname -m',
          'free -h',
          'mkdir -p ~/falcon-h1/models'
        ],
        note: 'Continue only when uname -m reports armv6l. Replace pi and raspberrypi.local with the user and hostname configured in Raspberry Pi Imager.'
      },
      {
        title: 'Copy the binary and GGUF to the Pi',
        summary: 'Run these commands from the llama.cpp directory on the build host, replacing the SSH destination if needed.',
        commands: [
          'scp build-armv6/bin/llama-completion pi@raspberrypi.local:~/falcon-h1/',
          'scp models/Falcon-H1-Tiny-90M-Instruct-Q4_0.gguf pi@raspberrypi.local:~/falcon-h1/models/'
        ]
      },
      {
        title: 'Run a constrained offline completion',
        summary: 'On the Pi, use one thread, a 128-token context, a 32-token output cap and disabled memory mapping to reduce pressure on its 512 MB, 32-bit environment.',
        commands: [
          'cd ~/falcon-h1',
          'chmod +x ./llama-completion',
          './llama-completion -m models/Falcon-H1-Tiny-90M-Instruct-Q4_0.gguf -p "Hello, how are you?" -n 32 -t 1 -c 128 --no-mmap'
        ],
        prompts: ['Hello, how are you?', 'What is the capital of Belgium?', 'Explain in one sentence what a Raspberry Pi is.'],
        note: 'A generated answer proves inference, not correctness. The creator showed factual mistakes even with the larger Q8_0 file.'
      }
    ],
    performance: [
      { label: 'Q2_K in the video', value: 'roughly one token every 3 seconds; output was largely incoherent' },
      { label: 'Q4 legacy result', value: 'produced a coherent greeting and was the creator\'s preferred balance' },
      { label: 'Q8_0 result', value: 'ran successfully but still returned a wrong capital for Albania' },
      { label: 'Practical verdict', value: 'educational extreme-hardware demo, not production-ready' }
    ],
    troubleshooting: [
      {
        problem: 'uname -m does not report armv6l',
        fix: 'Stop and identify the board and OS. This guide targets the Pi 1 Model B+ ARMv6 environment; a newer Pi or 64-bit userland needs a different compiler target.'
      },
      {
        problem: 'The Pi is not reachable over Wi-Fi',
        fix: 'The Model B+ has no onboard Wi-Fi. Connect Ethernet or use a USB Wi-Fi adapter already known to work with your Raspberry Pi OS image.'
      },
      {
        problem: 'Dockcross will not start on the build host',
        fix: 'Official Dockcross images are x86_64. Use a 64-bit x86_64 Docker host, or explicitly configure and validate amd64 emulation before trusting the output.'
      },
      {
        problem: 'The Pi reports Illegal instruction',
        fix: 'The binary was likely built for a newer ARM generation or with unsupported SIMD. Recheck the linux-armv6 toolchain, GGML_NATIVE=OFF and GGML_CPU_ARM_ARCH=armv6.'
      },
      {
        problem: 'The binary reports a loader or GLIBC error',
        fix: 'The cross-compiler runtime and the Pi OS userland do not match. Rebuild with a Dockcross ARMv6 variant compatible with the target OS instead of copying random shared libraries onto the Pi.'
      },
      {
        problem: 'Model loading fails or the process is killed',
        fix: 'Use Raspberry Pi OS Lite 32-bit, close other processes, keep one thread and context 128, and retain --no-mmap. Start with Q4_0 rather than Q8_0.'
      }
    ],
    faq: [
      { question: 'Is this useful as a daily local assistant?', answer: 'No. It is a compelling educational demonstration of extreme compatibility, but inference is very slow and a 90M model can be factually unreliable.' },
      { question: 'Can I follow the same guide on Raspberry Pi 2, 3, 4 or 5?', answer: 'Not exactly. Newer boards use different ARM generations and benefit from different compiler flags and binaries. This page intentionally documents the ARMv6 Raspberry Pi 1 Model B+ path.' },
      { question: 'Why does the guide use Ethernet?', answer: 'The Raspberry Pi 1 Model B+ has 100 Mb/s Ethernet but no onboard Wi-Fi. Ethernet avoids USB Wi-Fi chipset and driver compatibility problems during setup.' },
      { question: 'Why start with Q4_0 instead of a smaller IQ quantization?', answer: 'The creator found that newer importance-quantized formats rely on bit-manipulation patterns that are a poor fit for the old ARMv6 CPU. The legacy Q4 path was the best demonstrated balance of size and coherence.' },
      { question: 'Is Falcon-H1 Tiny open source?', answer: 'The weights are downloadable, but they use TII\'s Falcon-LLM License rather than Apache 2.0 or MIT. Review that license for your intended use. llama.cpp itself is MIT-licensed.' },
      { question: 'Has LocalClaw reproduced this on real hardware?', answer: 'No. Better Stack demonstrated the working experiment. LocalClaw source-reviewed the hardware facts, model files, pinned llama.cpp build options and Dockcross target, but has not physically reproduced the build.' }
    ],
    sources: [
      { label: 'Original Better Stack video', url: 'https://www.youtube.com/watch?v=u8XQsL38WjQ', type: 'Video' },
      { label: 'Falcon-H1 Tiny 90M official GGUF repository', url: 'https://huggingface.co/tiiuae/Falcon-H1-Tiny-90M-Instruct-GGUF', type: 'Model and weights' },
      { label: 'Falcon-LLM License', url: 'https://falconllm.tii.ae/falcon-terms-and-conditions.html', type: 'Model license' },
      { label: 'Raspberry Pi 1 Model B+ product page', url: 'https://www.raspberrypi.com/products/raspberry-pi-1-model-b-plus/', type: 'Hardware' },
      { label: 'Raspberry Pi computer hardware documentation', url: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html', type: 'Hardware documentation' },
      { label: 'llama.cpp source and MIT license', url: 'https://github.com/ggml-org/llama.cpp', type: 'Inference runtime' },
      { label: 'Dockcross ARMv6 toolchain', url: 'https://github.com/dockcross/dockcross#dockcrosslinux-armv6', type: 'Cross-compiler' },
      { label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/', type: 'Operating system tool' }
    ]
  },
  {
    slug: 'gemma-translator-raspberry-pi-5',
    title: 'Build an Offline Gemma Translator on Raspberry Pi 5',
    cardTitle: 'Gemma Offline Translator on Raspberry Pi 5',
    summary: 'Build a private voice-to-voice translator with Gemma 4, Moonshine speech models, a Raspberry Pi 5, a USB microphone and a speaker.',
    outcome: 'A standalone voice translator that records speech, transcribes it, translates locally with Gemma 4 and speaks the result without a cloud API after its models are cached.',
    image: '/images/diy/gemma-translator-raspberry-pi-5.png',
    imageAlt: 'Raspberry Pi 5 with active cooler connected to a USB microphone and compact speaker on a dark maker workbench',
    difficulty: 'Intermediate',
    budget: 'Complete build · price varies',
    duration: '1–2 hours plus model download',
    seo: {
      title: 'Build Gemma Translator on Raspberry Pi 5 | LocalClaw',
      description: 'Build a fully offline Gemma 4 voice translator on Raspberry Pi 5. Exact parts, DroneBot Workshop video, commands, fixes and offline test.'
    },
    topics: ['Offline voice AI', 'Raspberry Pi 5', 'Gemma 4'],
    status: ['Creator demonstrated', 'LocalClaw source-reviewed'],
    localClawTested: false,
    creator: {
      displayName: 'DroneBot Workshop',
      url: 'https://www.youtube.com/@Dronebotworkshop',
      implementationName: 'Google Creative Lab',
      implementationUrl: 'https://github.com/google-gemma/gemma-translator',
      implementationLabel: 'Project by',
      note: 'DroneBot Workshop published the independent Raspberry Pi tutorial and demonstrated the finished translator, including an offline English-to-French output test. A small Google Creative Lab team created the Apache-2.0 project. Google states that it is not an officially supported Google product.'
    },
    model: {
      name: 'Gemma 4 E2B Instruct for LiteRT-LM',
      author: 'Google AI Edge',
      url: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm',
      weightsUrl: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm',
      license: 'Apache-2.0',
      parameters: 'E2B effective',
      binarySize: '2,583 MB LiteRT-LM model',
      purpose: 'Offline text translation inside a voice pipeline — not a simultaneous interpreter'
    },
    video: {
      id: 'tyELRiuEG40',
      title: 'Build the Gemma Translator: No Internet Required',
      url: 'https://www.youtube.com/watch?v=tyELRiuEG40',
      embedUrl: 'https://www.youtube-nocookie.com/embed/tyELRiuEG40?rel=0&cc_load_policy=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/tyELRiuEG40/maxresdefault.jpg',
      uploadDate: '2026-08-23T19:01:12+00:00',
      duration: 'PT27M2S',
      durationLabel: '27:02'
    },
    repository: {
      name: 'google-gemma/gemma-translator',
      url: 'https://github.com/google-gemma/gemma-translator',
      license: 'Apache-2.0',
      reviewedCommit: '47f9b3ba40ca3650fb80ee42264a76d6a2b5f8ba'
    },
    page: {
      about: ['Gemma Translator', 'Gemma 4 E2B', 'Raspberry Pi 5', 'offline translation', 'voice AI', 'Moonshine'],
      howToTime: 'PT2H',
      estimatedCost: { currency: 'USD', value: '150-240' },
      tools: ['Raspberry Pi Imager', 'Git', 'Python 3.10+', 'Node.js 18+', 'npm'],
      hardwareFact: { title: 'Raspberry Pi 5 8 GB', detail: 'USB microphone · USB or Bluetooth speaker' },
      purposeFact: { title: 'Offline voice translation', detail: 'Cloud-free after every required model is cached' },
      videoTitle: 'Watch DroneBot Workshop build the translator',
      videoIntro: 'Bill assembles the Raspberry Pi setup, installs the full stack, fixes the current dependency-script failure, adds French output and disconnects networking to prove the final translation stays local.',
      compatibilityLabel: 'Appliance gate',
      compatibilityTitle: 'Use a Raspberry Pi 5 with 8 GB and active cooling',
      compatibilityText: 'The project documents a Raspberry Pi 5 with 8 GB RAM. Its 2.6 GB model and voice pipeline are too demanding for this guide to promise compatibility with smaller boards. Use a stable 27 W supply and active cooling for sustained local inference.',
      verificationText: 'LocalClaw checked the hardware gate, deployment flow, model identifier, language list and known setup failure against DroneBot Workshop\'s tutorial, the current Google repository and the official LiteRT-LM model card.',
      partsTitle: 'Buy the complete Raspberry Pi voice kit',
      guideTitle: 'Install and prove the translator offline',
      guideIntro: 'The order below follows the creator\'s successful build while pinning the reviewed Google commit. Commands are independently organized by LocalClaw and include checks before the long model download.',
      performanceTitle: 'Private, useful and intentionally not instant',
      performanceIntro: 'The Raspberry Pi CPU runs transcription, Gemma translation and speech synthesis in sequence. Expect a noticeable pause after releasing the record key.',
      secondaryTitle: 'French output works, French input does not',
      secondaryText: 'The reviewed app ships with English, Spanish, Japanese, Chinese, Korean and Arabic for speech input and output. DroneBot Workshop added French as a speech-output target, but Moonshine does not provide French input transcription in this build.',
      secondaryLinkLabel: 'Read the creator\'s French-output procedure',
      secondaryLinkUrl: 'https://dronebotworkshop.com/gemma-translate/',
      troubleshootingIntro: 'This project spans audio devices, Python packages, a 2.6 GB model, systemd and a Chromium kiosk. Isolate each layer instead of repeatedly reinstalling the entire image.',
      licenseNote: 'The Google Gemma Translator repository and the referenced LiteRT-LM Gemma 4 E2B package identify Apache 2.0 licensing. LocalClaw does not redistribute the repository, model, tutorial text or video. The project is experimental and not an officially supported Google product.',
      faqTitle: 'Gemma Translator on Raspberry Pi 5 FAQ',
      sourceCta: 'Open Google source'
    },
    requirements: [
      { label: 'Compute', value: 'Raspberry Pi 5 with 8 GB RAM' },
      { label: 'Operating system', value: '64-bit Raspberry Pi OS Bookworm for the documented tutorial path' },
      { label: 'Storage', value: '32 GB minimum microSD; keep at least 6 GB free before the model import' },
      { label: 'Audio', value: 'USB microphone plus USB, Bluetooth or headphone-output speaker' },
      { label: 'Display and control', value: 'HDMI display or touchscreen plus a USB keyboard for the documented kiosk controls' },
      { label: 'Power and cooling', value: 'Stable 27 W USB-C supply and active cooling recommended for sustained inference' },
      { label: 'Setup network', value: 'Internet required for packages and every language model used; translation can then run offline' }
    ],
    parts: [
      {
        name: 'Raspberry Pi 5 8 GB',
        requirement: 'Required',
        description: 'Use the 8 GB model specified by the project. A bundle is acceptable only when its power supply and cooling meet the requirements below.',
        amazonQuery: 'Raspberry Pi 5 8GB board'
      },
      {
        name: 'Official Raspberry Pi 27 W USB-C power supply',
        requirement: 'Required',
        description: 'Use a 5 V / 5 A supply suitable for Raspberry Pi 5, especially when the microphone, speaker and storage draw power over USB.',
        amazonQuery: 'official Raspberry Pi 5 27W USB-C power supply 5V 5A'
      },
      {
        name: 'Raspberry Pi 5 active cooler or fan case',
        requirement: 'Strongly recommended',
        description: 'Local inference keeps the CPU busy. Choose the official active cooler or a Pi 5 case with a real fan and unobstructed airflow.',
        amazonQuery: 'official Raspberry Pi 5 active cooler fan'
      },
      {
        name: 'USB desktop microphone',
        requirement: 'Required',
        description: 'A class-compliant USB microphone is the simplest path. The creator used a compact stick-style USB microphone and verified it before installation.',
        amazonQuery: 'USB desktop microphone Raspberry Pi class compliant'
      },
      {
        name: 'Compact USB speaker',
        requirement: 'Required unless using Bluetooth',
        description: 'Use a USB or Bluetooth speaker that Raspberry Pi OS exposes as an audio output. A small USB laptop speaker is sufficient.',
        amazonQuery: 'compact USB speaker Raspberry Pi laptop'
      },
      {
        name: '64 GB A2 microSD card',
        requirement: 'Recommended',
        description: 'The creator specifies 32 GB minimum. A reputable 64 GB A2 card gives safer headroom for Raspberry Pi OS, the 2.6 GB download, its imported copy and language assets.',
        amazonQuery: '64GB A2 microSD card Raspberry Pi'
      },
      {
        name: 'Micro-HDMI cable and USB keyboard',
        requirement: 'Required if not already owned',
        description: 'The documented setup uses a local display and keyboard. The final kiosk also relies on keyboard shortcuts for recording and language selection.',
        amazonQuery: 'Raspberry Pi 5 micro HDMI cable USB keyboard kit'
      }
    ],
    steps: [
      {
        title: 'Assemble and identify the exact hardware',
        summary: 'Install the active cooler, insert the prepared microSD card, then connect the USB microphone, speaker, display, keyboard, network and 27 W power supply.',
        checks: ['Confirm the board has 8 GB RAM.', 'Do not hide the active cooler under an incompatible case.', 'Keep Ethernet or Wi-Fi connected until every model and language asset has been downloaded.']
      },
      {
        title: 'Install Raspberry Pi OS and the host packages',
        summary: 'Flash 64-bit Raspberry Pi OS Bookworm, boot to the desktop, open a terminal and update the system before installing the build, audio and service tools used by the tutorial.',
        commands: [
          'sudo apt update && sudo apt full-upgrade -y',
          'sudo apt install -y git python3-venv python3-pip ffmpeg libasound2-dev pulseaudio-utils alsa-utils lsof netcat-openbsd nodejs npm'
        ],
        links: [{ label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/' }]
      },
      {
        title: 'Switch the kiosk session from Wayland to X11',
        summary: 'The reviewed deployment script writes an LXDE X11 kiosk autostart entry. Select X11 for the tutorial path, reboot and return to the terminal.',
        commands: [
          'sudo raspi-config nonint do_wayland W1',
          'sudo reboot'
        ]
      },
      {
        title: 'Prove microphone and speaker operation first',
        summary: 'List the capture and playback devices, then make a short recording and play it back. Do not start the AI installation until this simple audio loop works.',
        commands: [
          'arecord -l',
          'aplay -l',
          'pw-record test.wav',
          'pw-play test.wav',
          'rm test.wav'
        ],
        note: 'Press Ctrl+C to stop pw-record before running pw-play. An HDMI monitor may appear as an additional audio output.'
      },
      {
        title: 'Clone and pin the reviewed Google project',
        summary: 'Pin the source revision reviewed by LocalClaw so that a later upstream change cannot silently alter this guide.',
        commands: [
          'git clone https://github.com/google-gemma/gemma-translator.git',
          'cd gemma-translator',
          'git checkout 47f9b3ba40ca3650fb80ee42264a76d6a2b5f8ba',
          'chmod +x setup.sh download_model.sh start.sh deploy-pi.sh'
        ]
      },
      {
        title: 'Apply the documented dependency-script fix',
        summary: 'At the reviewed commit, setup.sh enables pip hash enforcement while requirements.txt contains no hashes. Remove only that incompatible flag before deployment.',
        commands: [
          'grep -- --require-hashes setup.sh',
          "sed -i 's/--require-hashes //' setup.sh"
        ],
        note: 'This fix is specific to the reviewed source state. Inspect setup.sh first and skip the edit if upstream has already removed the flag.'
      },
      {
        title: 'Run the one-command appliance deployment',
        summary: 'The script installs the Python environment, builds the React frontend, imports the 2.6 GB LiteRT-LM model, creates the systemd service and configures Chromium kiosk mode.',
        commands: [
          './deploy-pi.sh'
        ],
        note: 'DroneBot Workshop observed roughly 20–40 minutes for this stage. Keep at least 6 GB free and do not interrupt the model import.'
      },
      {
        title: 'Reboot, wait for the service and test a translation',
        summary: 'After reboot, Chromium should open the local interface. Select the source and target languages, hold Z while speaking, then release it to transcribe, translate and play the result.',
        commands: [
          'sudo reboot',
          'systemctl status --no-pager gemma-translator.service'
        ],
        prompts: ['Hello, my name is Bill.', 'Where is the nearest railway station?', 'Please speak more slowly.'],
        note: 'The kiosk can appear before the backend is ready. Wait several seconds before treating an initial localhost error as a failure.'
      },
      {
        title: 'Cache language assets and prove the offline boundary',
        summary: 'Use every language pair you plan to rely on while networking is still available. Then disable Wi-Fi or unplug Ethernet and repeat a translation.',
        checks: ['A translation after disconnection proves local inference only for assets already downloaded.', 'Record which language pairs were tested.', 'Do not claim all languages are offline until each required Moonshine asset has been cached.'],
        note: 'DroneBot Workshop demonstrated English speech translated to French output with Ethernet unplugged and no Wi-Fi configured.'
      }
    ],
    performance: [
      { label: 'Model file', value: '2,583 MB for the referenced Gemma 4 E2B LiteRT-LM package' },
      { label: 'Official Pi 5 benchmark', value: '7.6 decode tokens/second and 7.8-second first-token latency on a Pi 5 16 GB reference system' },
      { label: 'Tutorial hardware', value: 'Pi 5 8 GB; same CPU, but end-to-end voice latency is longer than the model-only benchmark' },
      { label: 'Practical verdict', value: 'Useful private appliance with a noticeable pause, not simultaneous live interpretation' }
    ],
    troubleshooting: [
      {
        problem: 'pip aborts with Hashes are required in --require-hashes mode',
        fix: 'At the reviewed commit, requirements.txt has pinned versions but no hashes. Confirm setup.sh still contains --require-hashes, remove that flag as shown in the guide, then rerun deploy-pi.sh.'
      },
      {
        problem: 'The microphone records nothing or playback uses HDMI',
        fix: 'Run arecord -l and aplay -l again, then repeat the pw-record/pw-play test. Set the desired Raspberry Pi OS input and output devices before restarting the translator service.'
      },
      {
        problem: 'Chromium reports localhost cannot be reached just after boot',
        fix: 'The kiosk can launch before the Python backend and LiteRT-LM server finish starting. Wait several seconds, then inspect systemctl status gemma-translator.service if the page does not recover.'
      },
      {
        problem: 'The interface is tiny on a large HDMI display',
        fix: 'The original UI targets a 480×320 display. Use Chromium zoom for a quick check, or follow DroneBot Workshop\'s documented device-scale-factor adjustment for the kiosk autostart entry.'
      },
      {
        problem: 'French appears as output but cannot transcribe spoken French',
        fix: 'This is a model-coverage boundary, not a microphone failure. The reviewed code supports six speech-input languages; the creator\'s French extension is output-only.'
      },
      {
        problem: 'A language stops working after the network is disconnected',
        fix: 'Reconnect temporarily and exercise that language pair so Moonshine can download its required assets. Disconnect again only after the pair succeeds once online.'
      }
    ],
    faq: [
      { question: 'Does the Gemma Translator need the internet?', answer: 'It needs internet access during installation and the first download of every required model or language asset. Once those assets are cached, the demonstrated translation pipeline can run without Wi-Fi, Ethernet or a cloud API.' },
      { question: 'Can this run on a Raspberry Pi 4 or a 4 GB Pi 5?', answer: 'This guide does not claim that compatibility. The official project specifies Raspberry Pi 5 with 8 GB RAM, and LocalClaw keeps that hardware gate rather than extrapolating to smaller boards.' },
      { question: 'Which languages work in the reviewed project?', answer: 'The source interface includes Arabic, English, Spanish, Japanese, Chinese and Korean for input and output. DroneBot Workshop also documented French as an output-only addition because French speech transcription is not available in the reviewed Moonshine configuration.' },
      { question: 'How fast is the offline translator?', answer: 'It is not instant. The official model card reports 7.6 decode tokens per second and 7.8 seconds to first token on a Raspberry Pi 5 reference benchmark, while the complete voice pipeline adds transcription and speech synthesis.' },
      { question: 'Is this an officially supported Google product?', answer: 'No. The public repository credits a small Google Creative Lab team but explicitly says the project is not an officially supported Google product.' },
      { question: 'Has LocalClaw reproduced this build?', answer: 'No. DroneBot Workshop demonstrated the completed translator. LocalClaw reviewed the tutorial, source, model package, hardware requirements and installation commands but has not physically reproduced the appliance.' }
    ],
    sources: [
      { label: 'DroneBot Workshop build video', url: 'https://www.youtube.com/watch?v=tyELRiuEG40', type: 'Video' },
      { label: 'DroneBot Workshop written tutorial and parts list', url: 'https://dronebotworkshop.com/gemma-translate/', type: 'Creator tutorial' },
      { label: 'Google Gemma Translator source', url: 'https://github.com/google-gemma/gemma-translator', type: 'Source code' },
      { label: 'Google Gemma Translator Apache-2.0 license', url: 'https://github.com/google-gemma/gemma-translator/blob/47f9b3ba40ca3650fb80ee42264a76d6a2b5f8ba/LICENSE', type: 'Project license' },
      { label: 'Gemma 4 E2B LiteRT-LM model package', url: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm', type: 'Model and benchmark' },
      { label: 'Raspberry Pi 5 hardware and power guidance', url: 'https://www.raspberrypi.com/products/raspberry-pi-5/', type: 'Hardware documentation' },
      { label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/', type: 'Operating system tool' }
    ]
  }
];

module.exports = { DIY_VERIFIED_DATE, projects };
