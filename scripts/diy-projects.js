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
      duration: 'PT9M53S'
    },
    repository: {
      name: 'andrisgauracs/needle-2-esp32',
      url: 'https://github.com/andrisgauracs/needle-2-esp32',
      license: 'Apache-2.0',
      reviewedCommit: '61cafad7014a5664bb3ffd5f0c457ce5aa6598ae'
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
  }
];

module.exports = { DIY_VERIFIED_DATE, projects };
