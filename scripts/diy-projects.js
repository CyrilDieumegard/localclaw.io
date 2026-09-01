const DIY_VERIFIED_DATE = '2026-08-30';
const DIY_INDEX_MODIFIED_DATE = '2026-09-01';

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
  },
  {
    slug: 'offline-voice-assistant-raspberry-pi-5',
    title: 'Build a Raspberry Pi 5 Offline Voice Assistant',
    cardTitle: 'Offline Voice Assistant on Raspberry Pi 5',
    summary: 'Build a private, portable voice assistant that listens with Whisper, answers with Qwen3 through Ollama and speaks with Piper — without a cloud API.',
    outcome: 'A battery-powered Raspberry Pi 5 assistant with a screen, microphone and speaker that can hear, think and answer locally after the required models are downloaded.',
    image: '/images/diy/offline-voice-assistant-raspberry-pi-5.png',
    imageAlt: 'Portable Raspberry Pi 5 voice assistant with a small display, microphone, speaker, active cooler and stacked battery board on a dark maker workbench',
    difficulty: 'Intermediate',
    budget: 'Complete build · price varies',
    duration: '2–4 hours plus downloads',
    publishedDate: '2026-09-01',
    verifiedDate: '2026-09-01',
    seo: {
      title: 'Build an Offline Voice Assistant on Raspberry Pi 5 | LocalClaw',
      description: 'Build a portable offline AI voice assistant with Raspberry Pi 5, Whisplay HAT, PiSugar, Whisper, Ollama Qwen3 and Piper. Full parts and steps.'
    },
    topics: ['Offline voice AI', 'Raspberry Pi 5', 'Whisplay'],
    status: ['Creator demonstrated', 'LocalClaw source-reviewed'],
    localClawTested: false,
    creator: {
      displayName: 'Jdaie Lin',
      url: 'https://www.youtube.com/@PiSugarStudio',
      implementationName: 'PiSugar',
      implementationUrl: 'https://github.com/PiSugar/whisplay-ai-chatbot',
      implementationLabel: 'Project by',
      note: 'Jdaie Lin published the complete Raspberry Pi 5 offline build on the PiSugar Studio channel. PiSugar maintains the Whisplay hardware driver, chatbot application and battery manager used by the project.'
    },
    model: {
      name: 'Qwen3 1.7B for Ollama',
      author: 'Qwen',
      url: 'https://huggingface.co/Qwen/Qwen3-1.7B',
      weightsUrl: 'https://ollama.com/library/qwen3:1.7b',
      license: 'Apache-2.0',
      parameters: '1.7B class',
      binarySize: '1.4 GB Ollama Q4_K_M package',
      purpose: 'Private local voice conversation with sequential speech recognition, text generation and speech synthesis'
    },
    video: {
      id: 'kFmhSTh167U',
      title: 'Offline AI on Raspberry Pi 5 — It Talks, Thinks locally without Wi-Fi! (Complete Tutorial)',
      url: 'https://www.youtube.com/watch?v=kFmhSTh167U',
      embedUrl: 'https://www.youtube-nocookie.com/embed/kFmhSTh167U?rel=0&cc_load_policy=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/kFmhSTh167U/maxresdefault.jpg',
      uploadDate: '2025-10-30T01:07:51-07:00',
      duration: 'PT19M29S',
      durationLabel: '19:29'
    },
    repository: {
      name: 'PiSugar/whisplay-ai-chatbot',
      url: 'https://github.com/PiSugar/whisplay-ai-chatbot',
      license: 'GPL-3.0',
      reviewedCommit: 'ee7301b2f7693111ee016f81c48a75d3387a7326'
    },
    page: {
      about: ['offline voice assistant', 'Raspberry Pi 5', 'Whisplay HAT', 'PiSugar 3 Plus', 'Whisper', 'Ollama', 'Qwen3 1.7B', 'Piper'],
      howToTime: 'PT4H',
      estimatedCost: { currency: 'USD', value: '180-280' },
      tools: ['Raspberry Pi Imager', 'SSH', 'Git', 'Whisper', 'Ollama', 'Piper'],
      hardwareFact: { title: 'Raspberry Pi 5 8 GB', detail: 'Whisplay HAT · PiSugar 3 Plus · active cooling' },
      purposeFact: { title: 'Offline voice conversation', detail: 'Local after models are cached; no cloud API required' },
      videoTitle: 'Watch Jdaie Lin build the complete assistant',
      videoIntro: 'The tutorial covers the physical stack, Raspberry Pi OS, SSH, Whisplay drivers, the chatbot, Ollama, Whisper, Piper, PiSugar power management, an offline conversation test and automatic startup.',
      compatibilityLabel: 'Hardware gate',
      compatibilityTitle: 'Use the Pi 5 8 GB and plan the stack before assembly',
      compatibilityText: 'The creator recommends 8 GB or more because the combined AI stack uses roughly 4 GB in the demonstrated configuration. Active cooling is essential. The battery, cooler, stackable GPIO header and Whisplay HAT occupy the same compact area, so confirm clearances before tightening anything.',
      verificationText: 'LocalClaw checked the parts and demonstrated flow against the original tutorial, PiSugar hardware documentation and the current Whisplay chatbot, driver and power-manager sources. The commands below use the current maintainer path at the reviewed commits rather than copying an older command transcript from the video.',
      partsTitle: 'Buy every part for the portable build',
      guideTitle: 'Assemble, install and prove the assistant offline',
      guideIntro: 'The video remains the visual assembly reference. This written path independently organizes the current official commands, pins the reviewed chatbot revision and adds checks before each long download.',
      performanceTitle: 'A real offline assistant with deliberate pauses',
      performanceIntro: 'This is a three-stage CPU pipeline on a small computer: Whisper transcribes, Qwen3 generates and Piper synthesizes. It is private and portable, but it will not respond like a cloud smart speaker.',
      secondaryTitle: 'Start with thinking disabled',
      secondaryText: 'The video demonstrates Qwen3 thinking mode, but visible reasoning adds latency on Raspberry Pi 5. Validate the complete audio loop with thinking disabled first, then enable it only if the slower response is useful to you.',
      secondaryLinkLabel: 'Open the official Qwen3 1.7B Ollama package',
      secondaryLinkUrl: 'https://ollama.com/library/qwen3:1.7b',
      troubleshootingIntro: 'Most failures are not model failures. Test the Whisplay hardware, each local engine and the final chatbot as separate layers before enabling automatic startup.',
      licenseNote: 'The Whisplay chatbot and PiSugar power manager are GPL-3.0; the Whisplay hardware driver and Qwen3 model identify Apache-2.0 licensing. Piper uses GPL-3.0 and OpenAI Whisper uses MIT. LocalClaw links to the original projects and does not redistribute their code, model packages, voice files or video.',
      faqTitle: 'Offline Raspberry Pi voice assistant FAQ',
      sourceCta: 'Open PiSugar source'
    },
    requirements: [
      { label: 'Compute', value: 'Raspberry Pi 5 with 8 GB RAM; the creator recommends 8 GB or more' },
      { label: 'Display and audio', value: 'PiSugar Whisplay HAT with LCD, onboard microphones, speaker and button' },
      { label: 'Battery', value: 'PiSugar 3 Plus 5000 mAh for the Raspberry Pi 5 build' },
      { label: 'Cooling', value: 'Active cooler with confirmed clearance around the battery and HAT stack' },
      { label: 'GPIO spacing', value: '2×20 stackable header/riser long enough to clear the cooler and expose all 40 pins' },
      { label: 'Storage', value: '64 GB A2 microSD recommended; 32 GB is the practical minimum' },
      { label: 'Operating system', value: 'Current 64-bit Raspberry Pi OS; SSH and network enabled during setup' },
      { label: 'Offline boundary', value: 'Internet required for installation and model downloads, then removable for normal use' }
    ],
    parts: [
      {
        name: 'Raspberry Pi 5 8 GB',
        requirement: 'Required',
        description: 'Use the 8 GB model shown in the tutorial. The complete Whisper, Ollama and Piper stack uses several gigabytes and should not be presented as a comfortable 4 GB build.',
        amazonQuery: 'Raspberry Pi 5 8GB board'
      },
      {
        name: 'PiSugar Whisplay HAT',
        requirement: 'Required',
        description: 'This combines the small LCD, microphones, speaker, RGB LEDs and interaction button used by the assistant. Confirm it includes the speaker and mounting hardware.',
        amazonQuery: 'PiSugar Whisplay HAT Raspberry Pi display microphone speaker'
      },
      {
        name: 'PiSugar 3 Plus 5000 mAh battery',
        requirement: 'Required for portable use',
        description: 'Choose the Plus 5000 mAh version documented for Raspberry Pi 5, not the smaller 1200 mAh PiSugar 3 intended for lighter boards.',
        amazonQuery: 'PiSugar 3 Plus 5000mAh Raspberry Pi 5 battery'
      },
      {
        name: 'Raspberry Pi 5 active cooler',
        requirement: 'Required',
        description: 'Local speech and LLM inference sustain CPU load. Confirm the cooler and its fasteners clear the PiSugar underside and the raised Whisplay HAT.',
        amazonQuery: 'official Raspberry Pi 5 active cooler'
      },
      {
        name: '2×20 stackable GPIO header',
        requirement: 'Required',
        description: 'The riser lifts the Whisplay HAT above the cooler while passing all 40 GPIO pins through. Match the pin length and board clearance shown in the video.',
        amazonQuery: 'Raspberry Pi 2x20 40 pin stackable GPIO header long pins'
      },
      {
        name: '64 GB A2 microSD card',
        requirement: 'Recommended',
        description: 'Use a reputable card with room for Raspberry Pi OS, build dependencies, the 1.4 GB Qwen package, Whisper weights, a Piper voice and logs.',
        amazonQuery: '64GB A2 microSD card Raspberry Pi'
      },
      {
        name: 'Official Raspberry Pi 27 W USB-C supply',
        requirement: 'Required for setup and charging',
        description: 'Use stable wall power while installing and downloading models. The PiSugar battery makes the finished device portable but still needs a suitable charger.',
        amazonQuery: 'official Raspberry Pi 5 27W USB-C power supply 5V 5A'
      }
    ],
    steps: [
      {
        title: 'Flash Raspberry Pi OS with SSH enabled',
        summary: 'Use Raspberry Pi Imager to write current 64-bit Raspberry Pi OS to the microSD card. Set a hostname, username, password, Wi-Fi and SSH in Imager before first boot.',
        links: [{ label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/' }],
        checks: ['Use 64-bit Raspberry Pi OS.', 'Keep networking enabled until every package, model and voice file is cached.', 'Record the hostname and login before ejecting the card.']
      },
      {
        title: 'Dry-fit the cooler, battery, riser and Whisplay HAT',
        summary: 'Install active cooling on the Pi 5, align the PiSugar 3 Plus underneath, add the 2×20 stackable header and seat the Whisplay HAT above the cooler. Check every pin before applying pressure.',
        checks: ['Disconnect all power before assembly.', 'Never offset the 40-pin connector by one row.', 'Do not bend a cooler fastener unless you understand the mechanical risk shown in the creator video.', 'Confirm the HAT sits level and no metal part contacts the battery board.']
      },
      {
        title: 'Install and test the current Whisplay driver',
        summary: 'SSH into the Pi, clone the official driver, pin the revision reviewed by LocalClaw, install it and reboot. Run the hardware demo before adding any AI software.',
        commands: [
          'git clone https://github.com/PiSugar/Whisplay.git --depth 1',
          'cd Whisplay',
          'git checkout a695240f866257033414697d47c3aa4c5f9b749c',
          'sudo bash install_driver.sh',
          'sudo reboot'
        ],
        note: 'After reboot, return to ~/Whisplay/example, install its requirements and run bash run_test.sh. Do not continue until the display, button, LEDs, microphone and speaker pass the hardware test.'
      },
      {
        title: 'Install the PiSugar power manager',
        summary: 'Install the official release-channel power manager, select the PiSugar 3 model when prompted and confirm that the battery service sees the board.',
        commands: [
          'cd ~',
          'wget -O pisugar-power-manager.sh https://cdn.pisugar.com/release/pisugar-power-manager.sh',
          'bash pisugar-power-manager.sh -c release',
          'systemctl status pisugar-server --no-pager'
        ],
        note: 'The official manager exposes its local web interface on port 8421. Change its default credentials before exposing that port beyond your trusted LAN.'
      },
      {
        title: 'Clone and build the reviewed Whisplay chatbot',
        summary: 'Clone the application, pin the current reviewed revision, install its system and Python dependencies, then load the Node environment added to your shell.',
        commands: [
          'cd ~',
          'git clone https://github.com/PiSugar/whisplay-ai-chatbot.git',
          'cd whisplay-ai-chatbot',
          'git checkout ee7301b2f7693111ee016f81c48a75d3387a7326',
          'bash install_dependencies.sh',
          'source ~/.bashrc',
          'bash build.sh'
        ],
        note: 'The current repository has evolved since the 2025 video. Pinning the reviewed commit keeps the commands and configuration fields on this page reproducible.'
      },
      {
        title: 'Install and cache the three offline engines',
        summary: 'Install Ollama and pull Qwen3 1.7B, install Whisper and cache its tiny English model, then install Piper HTTP and download one English voice.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'bash scripts/install_ollama.sh',
          'ollama pull qwen3:1.7b',
          'python3 -m pip install -U openai-whisper --break-system-packages',
          'python3 -c "import whisper; whisper.load_model(\'tiny\')"',
          "python3 -m pip install 'piper-tts[http]' --break-system-packages",
          'mkdir -p /home/pi/piper',
          'cd /home/pi/piper',
          'python3 -m piper.download_voices en_US-amy-medium'
        ],
        note: 'The /home/pi paths match the official defaults and the creator setup. If your Raspberry Pi username is not pi, use your actual home directory consistently in .env.'
      },
      {
        title: 'Configure the local voice pipeline',
        summary: 'Run the official configuration wizard, choose Whisper for ASR, Ollama for the LLM and Piper HTTP for TTS, then verify the critical values in .env.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'whisplay configure',
          "grep -E '^(ASR_SERVER|LLM_SERVER|TTS_SERVER|OLLAMA_MODEL|SERVE_OLLAMA|WHISPER_MODEL_SIZE_OR_PATH|PIPER_HTTP_MODEL|ENABLE_THINKING)=' .env"
        ],
        checks: ['ASR_SERVER=whisper', 'LLM_SERVER=ollama', 'TTS_SERVER=piper-http', 'OLLAMA_MODEL=qwen3:1.7b', 'SERVE_OLLAMA=true', 'WHISPER_MODEL_SIZE_OR_PATH=/home/pi/.cache/whisper/tiny.pt', 'PIPER_HTTP_MODEL=/home/pi/piper/en_US-amy-medium', 'ENABLE_THINKING=false for the first full test'],
        note: 'If the wizard does not expose one of these advanced fields, edit .env directly. Never add a cloud API key for this fully local configuration.'
      },
      {
        title: 'Run the chatbot and test the complete audio loop',
        summary: 'Start the application in the foreground, press the Whisplay button, speak a short request and wait for the display and speaker response. Keep this foreground test visible until every stage works.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'bash run_chatbot.sh'
        ],
        prompts: ['Tell me a short joke.', 'Give me three ingredients for a pizza.', 'What can I do without an internet connection?'],
        note: 'The first Whisper and Ollama request is slower because processes and model data are warming up. Thinking mode should remain disabled during this baseline test.'
      },
      {
        title: 'Disconnect networking and enable startup only after proof',
        summary: 'Stop the foreground process, disconnect Wi-Fi or Ethernet, repeat the same voice request, then install the startup service once the offline test succeeds.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'bash startup.sh',
          'systemctl status chatbot --no-pager',
          'journalctl -u chatbot -n 100 --no-pager'
        ],
        checks: ['Qwen3, Whisper and the Piper voice must already be present locally.', 'A successful disconnected request proves the demonstrated pipeline, not every optional plugin.', 'startup.sh switches the Pi to multi-user mode and disables the graphical desktop.', 'If whisplay-daemon is installed, follow the current repository warning instead of creating a competing legacy chatbot service.']
      }
    ],
    performance: [
      { label: 'Combined working memory', value: 'roughly 4 GB in the creator\'s demonstrated configuration' },
      { label: 'Qwen3 Ollama package', value: '1.4 GB Q4_K_M download for qwen3:1.7b' },
      { label: 'Response path', value: 'Whisper → Ollama/Qwen3 → Piper; each stage adds latency' },
      { label: 'Practical verdict', value: 'Private and portable with visible pauses; not an instant smart-speaker replacement' }
    ],
    troubleshooting: [
      {
        problem: 'The Whisplay screen or audio does not work',
        fix: 'Return to the official Whisplay example test. Recheck the 40-pin alignment, SPI/I2C/I2S driver installation and audio device before debugging Ollama or the chatbot.'
      },
      {
        problem: 'Ollama answers in the terminal but the chatbot does not',
        fix: 'Confirm LLM_SERVER=ollama, OLLAMA_MODEL=qwen3:1.7b and OLLAMA_ENDPOINT=http://localhost:11434 in .env. Run ollama list and curl the local Ollama endpoint before restarting the chatbot.'
      },
      {
        problem: 'Whisper downloads again or fails after disconnecting Wi-Fi',
        fix: 'Confirm /home/pi/.cache/whisper/tiny.pt exists and WHISPER_MODEL_SIZE_OR_PATH points to that exact file. Cache the model while online before repeating the offline test.'
      },
      {
        problem: 'Piper starts but produces no audible response',
        fix: 'Confirm both en_US-amy-medium.onnx and its JSON file exist under /home/pi/piper, verify PIPER_HTTP_MODEL uses the matching basename path, then test the Whisplay speaker independently.'
      },
      {
        problem: 'The Pi becomes hot, throttles or restarts',
        fix: 'Stop the chatbot and inspect cooling, power and GPIO-stack clearance. Use active cooling, a stable supply during setup and do not compress the cooler or battery against another board.'
      },
      {
        problem: 'Responses take much longer with thinking mode',
        fix: 'Set ENABLE_THINKING=false and restart the chatbot. Thinking produces more tokens and is an optional demonstration mode, not a requirement for a useful offline voice assistant.'
      },
      {
        problem: 'startup.sh refuses because whisplay-daemon is present',
        fix: 'Do not run two managers for the same hardware. The current project recommends registering the chatbot with whisplay-daemon; use the repository\'s current daemon path or explicitly stop and disable the daemon before choosing legacy chatbot.service mode.'
      }
    ],
    faq: [
      { question: 'Is this Raspberry Pi voice assistant really offline?', answer: 'Yes after setup, if Qwen3, the Whisper checkpoint and the Piper voice are already stored locally. Internet is still required to install packages and download those assets. Optional cloud providers or plugins are outside this offline claim.' },
      { question: 'Why does the guide require a Raspberry Pi 5 with 8 GB?', answer: 'Jdaie Lin recommends 8 GB or more and reports that the combined AI software uses roughly 4 GB. LocalClaw keeps that demonstrated hardware gate rather than promising a comfortable 4 GB build.' },
      { question: 'What does the Whisplay HAT add?', answer: 'It provides the small LCD, microphones, speaker, RGB LEDs and button used for the assistant interaction, avoiding a collection of separate audio and display peripherals.' },
      { question: 'Can I use a different Ollama model?', answer: 'Yes, but qwen3:1.7b is the model demonstrated in the tutorial and the only model covered by this guide. Larger models increase memory use and latency; other models may handle thinking or tools differently.' },
      { question: 'Do I need the PiSugar battery?', answer: 'No for a desk-only assistant, but yes for the portable build shown in the video. The PiSugar 3 Plus 5000 mAh is the documented Raspberry Pi 5 option.' },
      { question: 'Has LocalClaw physically reproduced this build?', answer: 'No. Jdaie Lin demonstrated the finished device. LocalClaw verified the hardware list, current repositories, model package, licenses and installation path, but has not physically assembled this appliance.' }
    ],
    sources: [
      { label: 'Jdaie Lin complete offline assistant video', url: 'https://www.youtube.com/watch?v=kFmhSTh167U', type: 'Video' },
      { label: 'PiSugar Whisplay AI Chatbot source', url: 'https://github.com/PiSugar/whisplay-ai-chatbot', type: 'Source code' },
      { label: 'Whisplay AI Chatbot GPL-3.0 license', url: 'https://github.com/PiSugar/whisplay-ai-chatbot/blob/ee7301b2f7693111ee016f81c48a75d3387a7326/LICENSE', type: 'Project license' },
      { label: 'PiSugar Whisplay HAT driver', url: 'https://github.com/PiSugar/Whisplay', type: 'Hardware driver' },
      { label: 'PiSugar Whisplay HAT product page', url: 'https://www.pisugar.com/products/whisplay-hat-for-pi-zero-2w-audio-display', type: 'Hardware' },
      { label: 'PiSugar 3 series compatibility', url: 'https://docs.pisugar.com/docs/product-wiki/battery/pisugar3/pisugar-3-series', type: 'Battery documentation' },
      { label: 'PiSugar power manager', url: 'https://github.com/PiSugar/pisugar-power-manager-rs', type: 'Battery software' },
      { label: 'Qwen3 1.7B official model', url: 'https://huggingface.co/Qwen/Qwen3-1.7B', type: 'Model and license' },
      { label: 'Qwen3 1.7B Ollama package', url: 'https://ollama.com/library/qwen3:1.7b', type: 'Inference package' },
      { label: 'OpenAI Whisper source', url: 'https://github.com/openai/whisper', type: 'Speech recognition' },
      { label: 'Piper source and CLI', url: 'https://github.com/OHF-Voice/piper1-gpl', type: 'Speech synthesis' },
      { label: 'Raspberry Pi 5 hardware guidance', url: 'https://www.raspberrypi.com/products/raspberry-pi-5/', type: 'Hardware documentation' },
      { label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/', type: 'Operating system tool' }
    ]
  },
  {
    slug: 'pocket-ai-chatbot-raspberry-pi-zero-2-w',
    title: 'Build a Pocket AI Chatbot on Raspberry Pi Zero 2 W',
    cardTitle: 'Pocket AI Chatbot on Raspberry Pi Zero 2 W',
    summary: 'Build a tiny battery-powered voice chatbot with a screen, microphone and speaker, using a Raspberry Pi Zero 2 W and cloud AI APIs.',
    outcome: 'A pocket-sized push-to-talk chatbot that captures speech, sends it to a configured cloud AI service and plays the spoken answer through the Whisplay HAT.',
    image: '/images/diy/pocket-ai-chatbot-raspberry-pi-zero-2-w.png',
    imageAlt: 'Pocket AI chatbot made from a Raspberry Pi Zero 2 W, Whisplay audio display HAT and slim battery board on a dark maker workbench',
    difficulty: 'Intermediate',
    budget: 'Complete build · price varies',
    duration: '1.5–3 hours plus installation',
    publishedDate: '2026-09-01',
    verifiedDate: '2026-09-01',
    seo: {
      title: 'Build a Pocket AI Chatbot on Raspberry Pi Zero 2 W | LocalClaw',
      description: 'Build a talking pocket AI chatbot with Raspberry Pi Zero 2 W, Whisplay HAT and PiSugar 3. Exact parts, cloud setup, steps and troubleshooting.'
    },
    topics: ['Cloud voice AI', 'Raspberry Pi Zero 2 W', 'Whisplay'],
    status: ['Creator demonstrated', 'LocalClaw source-reviewed'],
    localClawTested: false,
    creator: {
      displayName: 'Jdaie Lin',
      url: 'https://www.youtube.com/@PiSugarStudio',
      implementationName: 'PiSugar',
      implementationUrl: 'https://github.com/PiSugar/whisplay-ai-chatbot',
      implementationLabel: 'Project by',
      note: 'Jdaie Lin published the original Pi Zero 2 W tutorial on the PiSugar Studio channel. PiSugar maintains the Whisplay driver, chatbot application and battery software used by the build.'
    },
    model: {
      name: 'OpenAI API voice pipeline',
      author: 'OpenAI',
      url: 'https://platform.openai.com/docs/overview',
      weightsUrl: 'https://platform.openai.com/api-keys',
      license: 'Hosted API service',
      parameters: 'Cloud model',
      binarySize: 'No local model weights',
      purpose: 'Cloud speech recognition, language generation and speech synthesis from a pocket-sized Raspberry Pi interface'
    },
    video: {
      id: 'Nwu2DruSuyI',
      title: 'This Tiny Raspberry Pi Chatbot Actually Talks! 🤖 | Build an AI Chatbot with Whisplay HAT & PiSugar',
      url: 'https://www.youtube.com/watch?v=Nwu2DruSuyI',
      embedUrl: 'https://www.youtube-nocookie.com/embed/Nwu2DruSuyI?rel=0&cc_load_policy=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/Nwu2DruSuyI/hqdefault.jpg',
      uploadDate: '2025-10-13T07:27:31-07:00',
      duration: 'PT11M16S',
      durationLabel: '11:16'
    },
    repository: {
      name: 'PiSugar/whisplay-ai-chatbot',
      url: 'https://github.com/PiSugar/whisplay-ai-chatbot',
      license: 'GPL-3.0',
      reviewedCommit: 'ee7301b2f7693111ee016f81c48a75d3387a7326'
    },
    page: {
      about: ['pocket AI chatbot', 'Raspberry Pi Zero 2 W', 'Whisplay HAT', 'PiSugar 3', 'cloud voice AI', 'OpenAI API'],
      howToTime: 'PT3H',
      tools: ['Raspberry Pi Imager', 'SSH', 'Git', 'Whisplay CLI', 'OpenAI API'],
      hardwareFact: { title: 'Raspberry Pi Zero 2 W', detail: 'Whisplay HAT · PiSugar 3 1200 mAh' },
      purposeFact: { title: 'Pocket cloud chatbot', detail: 'Internet and a funded API key required during use' },
      videoTitle: 'Watch Jdaie Lin build the pocket chatbot',
      videoIntro: 'The tutorial covers hardware assembly, Raspberry Pi OS, SSH, Whisplay drivers, chatbot configuration, volume adjustment, automatic startup and battery status in a compact Pi Zero 2 W stack.',
      compatibilityLabel: 'Cloud boundary',
      compatibilityTitle: 'The Pi Zero runs the interface, not the AI model',
      compatibilityText: 'This build sends audio and prompts to configured cloud services. Normal conversations require working Wi-Fi, a valid API key and available account credit; API usage can incur charges. It is not the offline Raspberry Pi 5 build listed separately in this directory.',
      verificationText: 'LocalClaw checked the hardware and install path against the original video, the current PiSugar repository, Whisplay driver and official PiSugar documentation. The commands below pin the reviewed source revisions and keep credentials out of logs.',
      partsTitle: 'Buy the exact pocket-size stack',
      guideTitle: 'Assemble, configure and test the cloud chatbot',
      guideIntro: 'Use the original video as the visual assembly reference. This independent LocalClaw path follows the current official repository, adds credential protection and separates hardware, cloud and startup checks.',
      performanceTitle: 'Small hardware, cloud-dependent response time',
      performanceIntro: 'The Zero 2 W handles the display, button and audio stream while remote services do the heavy inference. Response time therefore depends on Wi-Fi, API availability and the selected models.',
      secondaryTitle: 'Use the prebuilt image only as a shortcut',
      secondaryText: 'PiSugar also publishes a basic prebuilt image for this hardware. The manual route is easier to audit and troubleshoot; use the image only if its release notes match your board and you still replace all placeholder credentials.',
      secondaryLinkLabel: 'Open the official prebuilt-image guide',
      secondaryLinkUrl: 'https://github.com/PiSugar/whisplay-ai-chatbot/wiki/Prebuild-Image-%E2%80%90-Basic',
      troubleshootingIntro: 'Prove the screen, microphones and speaker before debugging the API. Then test credentials and network access before enabling the boot service.',
      licenseNote: 'The Whisplay chatbot is GPL-3.0 and the Whisplay hardware driver identifies Apache-2.0 licensing. OpenAI is a Hosted API service governed separately by provider terms and billing. LocalClaw links to the original projects and does not redistribute their code, credentials, video or model outputs.',
      faqTitle: 'Pocket Raspberry Pi chatbot FAQ',
      sourceCta: 'Open PiSugar source'
    },
    requirements: [
      { label: 'Compute', value: 'Raspberry Pi Zero 2 W with a correctly soldered 40-pin GPIO header' },
      { label: 'Display and audio', value: 'PiSugar Whisplay HAT with LCD, microphones, speaker, button and RGB LEDs' },
      { label: 'Battery', value: 'PiSugar 3 1200 mAh, the documented Zero 2 W version' },
      { label: 'Storage', value: '16 GB microSD minimum in the official image guide; 32 GB A2 recommended here' },
      { label: 'Operating system', value: 'Current 64-bit Raspberry Pi OS with SSH and Wi-Fi configured' },
      { label: 'Cloud access', value: 'Internet connection, OpenAI API key and sufficient API account credit for normal use' },
      { label: 'Privacy', value: 'Voice recordings and prompts leave the Raspberry Pi when cloud providers are selected' }
    ],
    parts: [
      {
        name: 'Raspberry Pi Zero 2 W with headers',
        requirement: 'Required',
        description: 'Choose a Zero 2 W with the 40-pin header already soldered, or add a correctly soldered header before stacking the HAT. A full-size Pi 5 is not required for this cloud version.',
        amazonQuery: 'Raspberry Pi Zero 2 W with pre soldered GPIO header'
      },
      {
        name: 'PiSugar Whisplay HAT',
        requirement: 'Required',
        description: 'This board combines the portrait LCD, microphones, speaker, button and status LEDs used by the tutorial. Confirm the package includes its speaker and mounting hardware.',
        amazonQuery: 'PiSugar Whisplay HAT Raspberry Pi Zero 2 W audio display'
      },
      {
        name: 'PiSugar 3 1200 mAh battery',
        requirement: 'Required for portable use',
        description: 'Use the compact 1200 mAh PiSugar 3 documented for the Zero 2 W build, not the larger PiSugar 3 Plus intended for Raspberry Pi 5.',
        amazonQuery: 'PiSugar 3 1200mAh Raspberry Pi Zero 2 W battery'
      },
      {
        name: '32 GB A2 microSD card',
        requirement: 'Recommended',
        description: 'The official prebuilt path requires at least 16 GB. A reputable 32 GB A2 card leaves room for Raspberry Pi OS, dependencies, builds and logs.',
        amazonQuery: '32GB A2 microSD card Raspberry Pi Zero 2 W'
      },
      {
        name: 'USB-C charging cable and 5 V adapter',
        requirement: 'Required for setup and charging',
        description: 'Use a regulated adapter and a reliable cable while installing. Confirm the connector and charging instructions against the PiSugar 3 documentation before powering the assembled stack.',
        amazonQuery: 'USB C 5V 3A power adapter cable Raspberry Pi PiSugar'
      }
    ],
    steps: [
      {
        title: 'Flash Raspberry Pi OS and enable remote access',
        summary: 'Use Raspberry Pi Imager to write current 64-bit Raspberry Pi OS. Set the hostname, username, password, Wi-Fi and SSH before the first boot.',
        links: [
          { label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/' },
          { label: 'Optional PiSugar prebuilt image', url: 'https://github.com/PiSugar/whisplay-ai-chatbot/wiki/Prebuild-Image-%E2%80%90-Basic' }
        ],
        checks: ['Use a 16 GB or larger microSD card.', 'Record the hostname and login.', 'Keep Wi-Fi available because this version requires cloud access during use.']
      },
      {
        title: 'Assemble the battery, Pi Zero and Whisplay HAT',
        summary: 'With all power disconnected, mount the PiSugar 3 beneath the Raspberry Pi Zero 2 W and align the Whisplay HAT over the complete 40-pin header.',
        checks: ['Never attach or move a HAT while powered.', 'Check the first and last GPIO pins before pressing the boards together.', 'Use the supplied spacers so no solder joint or metal fastener touches the battery.']
      },
      {
        title: 'Boot, connect over SSH and update the Pi',
        summary: 'Start on stable external power, connect to the configured hostname and update Raspberry Pi OS before adding the hardware driver.',
        commands: [
          'ssh your-user@your-hostname.local',
          'sudo apt update',
          'sudo apt full-upgrade -y'
        ]
      },
      {
        title: 'Install and test the reviewed Whisplay driver',
        summary: 'Clone the official driver, pin the revision reviewed by LocalClaw, install it and reboot. Run the supplied hardware example before installing the chatbot.',
        commands: [
          'cd ~',
          'git clone https://github.com/PiSugar/Whisplay.git --depth 1',
          'cd Whisplay',
          'git checkout a695240f866257033414697d47c3aa4c5f9b749c',
          'sudo bash install_driver.sh',
          'sudo reboot'
        ],
        note: 'After reboot, use the official example test to confirm the display, button, LEDs, microphone and speaker. Do not debug the cloud API until the hardware passes.'
      },
      {
        title: 'Install and build the reviewed chatbot',
        summary: 'Clone the PiSugar application, pin the reviewed revision, install its dependencies and build the interface.',
        commands: [
          'cd ~',
          'git clone https://github.com/PiSugar/whisplay-ai-chatbot.git',
          'cd whisplay-ai-chatbot',
          'git checkout ee7301b2f7693111ee016f81c48a75d3387a7326',
          'bash install_dependencies.sh',
          'source ~/.bashrc',
          'bash build.sh'
        ]
      },
      {
        title: 'Configure cloud speech, chat and voice safely',
        summary: 'Run the interactive wizard and select OpenAI for ASR, LLM and TTS. Enter the API key only on the Raspberry Pi, restrict the .env file and verify provider names without printing the secret.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'whisplay configure',
          'chmod 600 .env',
          "grep -E '^(ASR_SERVER|LLM_SERVER|TTS_SERVER)=' .env"
        ],
        checks: ['ASR_SERVER=openai', 'LLM_SERVER=openai', 'TTS_SERVER=openai', 'Never paste OPENAI_API_KEY into screenshots, shell history, Git or support messages.', 'Review current API pricing and set account limits before repeated tests.'],
        note: 'The reviewed source currently defaults to hosted models when explicit overrides are absent. Provider availability and pricing can change, so confirm the current OpenAI documentation before choosing overrides.'
      },
      {
        title: 'Run one complete push-to-talk test',
        summary: 'Start the chatbot in the foreground, press the Whisplay button, speak a short request and wait for the displayed and spoken answer.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'bash run_chatbot.sh'
        ],
        prompts: ['Say hello in one short sentence.', 'Give me one idea for a weekend project.'],
        note: 'A successful answer proves hardware, network and API access together. If volume is low, open alsamixer and adjust the Whisplay output before changing AI settings.'
      },
      {
        title: 'Install the PiSugar manager and check the battery',
        summary: 'Install the official PiSugar power manager, select the PiSugar 3 model when prompted and verify that its service can read the battery.',
        commands: [
          'cd ~',
          'wget -O pisugar-power-manager.sh https://cdn.pisugar.com/release/pisugar-power-manager.sh',
          'bash pisugar-power-manager.sh -c release',
          'systemctl status pisugar-server --no-pager'
        ],
        note: 'The manager exposes a local web interface on port 8421. Change default credentials and do not expose it directly to the public internet.'
      },
      {
        title: 'Enable startup only after the foreground test passes',
        summary: 'Stop the foreground process, run the official startup helper and inspect the service and log after reboot.',
        commands: [
          'cd ~/whisplay-ai-chatbot',
          'bash startup.sh',
          'systemctl status chatbot --no-pager',
          'tail -n 100 chatbot.log'
        ],
        checks: ['Run startup.sh as the normal user, not with sudo.', 'The helper may switch the Pi to headless multi-user mode.', 'If whisplay-daemon is installed, follow the current repository warning instead of creating a competing service.']
      }
    ],
    performance: [
      { label: 'Local workload', value: 'Screen, button, microphone capture, audio playback and API client' },
      { label: 'AI inference', value: 'Remote; no LLM, ASR or TTS model weights run on the Pi Zero in this configuration' },
      { label: 'Latency', value: 'Depends on Wi-Fi, upload speed, provider availability and selected cloud models' },
      { label: 'Battery', value: '1200 mAh portable pack; runtime varies with load, audio volume, Wi-Fi and battery condition' }
    ],
    troubleshooting: [
      {
        problem: 'The screen, button or audio does not work',
        fix: 'Return to the Whisplay driver example. Recheck 40-pin alignment, driver installation and ALSA devices before touching API configuration.'
      },
      {
        problem: 'The chatbot reports an authentication or quota error',
        fix: 'Confirm the key belongs to the intended API project, billing or credits are available and the account can access the configured services. Replace a leaked key immediately; never print it for debugging.'
      },
      {
        problem: 'Recording works but no answer arrives',
        fix: 'Verify Wi-Fi and DNS from the Pi, then inspect chatbot.log for the provider stage that failed. A browser subscription does not automatically include API credit.'
      },
      {
        problem: 'The response is delayed or cuts out',
        fix: 'Test close to the Wi-Fi access point, reduce competing traffic and use a short prompt. Cloud response time includes upload, speech recognition, generation, synthesis and download.'
      },
      {
        problem: 'The speaker is too quiet or distorted',
        fix: 'Use alsamixer to adjust the Whisplay output and rerun the hardware audio test. Avoid maximum gain if it clips; this is independent of the cloud model.'
      },
      {
        problem: 'startup.sh refuses because whisplay-daemon is present',
        fix: 'Do not run two managers for the same hardware. Use the repository daemon registration path, or deliberately stop and disable the daemon before choosing the legacy chatbot.service mode.'
      }
    ],
    faq: [
      { question: 'Does this Pi Zero 2 W chatbot work offline?', answer: 'No in the documented configuration. The Pi handles the interface and audio, but speech recognition, the language model and speech synthesis use cloud APIs. Internet access, a valid key and available API credit are required for normal conversations.' },
      { question: 'How is this different from the Raspberry Pi 5 offline assistant?', answer: 'This project is smaller and uses a PiSugar 3 1200 mAh battery, but sends AI work to the cloud. The separate Pi 5 guide downloads Whisper, Qwen3 and Piper so the demonstrated conversation loop can run locally after setup.' },
      { question: 'Does a ChatGPT subscription pay for the API?', answer: 'No. ChatGPT subscriptions and API billing are separate. Create an API project, review current pricing and set spending limits before using the device.' },
      { question: 'Can I use the official prebuilt image?', answer: 'Yes. PiSugar publishes a basic image for a Pi Zero 2 W, Whisplay HAT, PiSugar 3 and 16 GB or larger card. Check the release notes, update it, replace placeholder credentials and test each hardware function after flashing.' },
      { question: 'How long will the 1200 mAh battery last?', answer: 'The official documentation identifies the capacity but this guide does not promise a runtime. Screen brightness, speaker volume, Wi-Fi activity, CPU load, battery age and power settings all affect it.' },
      { question: 'Has LocalClaw physically reproduced this build?', answer: 'No. Jdaie Lin demonstrated the completed device. LocalClaw verified the tutorial metadata, hardware list, current repositories, official documentation and install path, but has not physically assembled it.' }
    ],
    sources: [
      { label: 'Jdaie Lin pocket chatbot tutorial', url: 'https://www.youtube.com/watch?v=Nwu2DruSuyI', type: 'Video' },
      { label: 'PiSugar Whisplay AI Chatbot source', url: 'https://github.com/PiSugar/whisplay-ai-chatbot', type: 'Source code' },
      { label: 'Whisplay AI Chatbot GPL-3.0 license', url: 'https://github.com/PiSugar/whisplay-ai-chatbot/blob/ee7301b2f7693111ee016f81c48a75d3387a7326/LICENSE', type: 'Project license' },
      { label: 'PiSugar Whisplay HAT driver', url: 'https://github.com/PiSugar/Whisplay', type: 'Hardware driver' },
      { label: 'PiSugar Whisplay HAT product page', url: 'https://www.pisugar.com/products/whisplay-hat-for-pi-zero-2w-audio-display', type: 'Hardware' },
      { label: 'PiSugar 3 series documentation', url: 'https://docs.pisugar.com/docs/product-wiki/battery/pisugar3/pisugar-3-series', type: 'Battery documentation' },
      { label: 'PiSugar power manager', url: 'https://github.com/PiSugar/pisugar-power-manager-rs', type: 'Battery software' },
      { label: 'PiSugar basic prebuilt image guide', url: 'https://github.com/PiSugar/whisplay-ai-chatbot/wiki/Prebuild-Image-%E2%80%90-Basic', type: 'Prebuilt image' },
      { label: 'Raspberry Pi Zero 2 W product brief', url: 'https://pip-assets.raspberrypi.com/categories/584-raspberry-pi-zero-2-w/documents/RP-008359-DS/raspberry-pi-zero-2-w-product-brief.pdf', type: 'Hardware documentation' },
      { label: 'Raspberry Pi Imager', url: 'https://www.raspberrypi.com/software/', type: 'Operating system tool' },
      { label: 'OpenAI API documentation', url: 'https://platform.openai.com/docs/overview', type: 'Cloud API' },
      { label: 'OpenAI API pricing', url: 'https://platform.openai.com/docs/pricing', type: 'Cloud pricing' }
    ]
  }
];

module.exports = { DIY_VERIFIED_DATE, DIY_INDEX_MODIFIED_DATE, projects };
