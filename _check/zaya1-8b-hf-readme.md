---
license: apache-2.0
---
# ZAYA1-8B

ZAYA1-8B is a small mixture of experts language model with 760M active parameters and 8.4B total parameters trained end-to-end by Zyphra. ZAYA1-8B sets a new standard of intelligence efficiency for its parameter count through a combination of novel architecture and innovations in pretraining and post-training. 

ZAYA1-8B excels at detailed long-form reasoning especially for mathematical and coding task. It punches heavily above its weight in these regimes and due to its inference efficiency and small size can be highly effective in test-time compute harnesses.

Due to its small total parameter count, ZAYA1-8B can also be deployed on-device for local LLM applications.

Learn more in our [technical report](https://arxiv.org/abs/2605.05365) and [blog](https://www.zyphra.com/post/zaya1-8b).

This is the post-trained reasoning version of ZAYA1-8B. The pretraining base can be found [here](https://huggingface.co/Zyphra/ZAYA1-reasoning-base).

## Performance

ZAYA1-8B performs extremely strongly, especially in challenging mathematical, reasoning, and coding benchmarks. ZAYA1-8B is competitive with models several times its own size including frontier-scale reasoning models at mathematical benchmarks.

![ZAYA_ttc_paper_light_no_dsv32_lcb_no_o4_hmmt_feb_dsv32_925_claude45_base_labels_matched_gap_transparent](https://cdn-uploads.huggingface.co/production/uploads/65c05e75c084467acab2f84a/f5tbexK3BumixnJuBZxo_.png)

![western_os_comparison_transparent_barchart](https://cdn-uploads.huggingface.co/production/uploads/65c05e75c084467acab2f84a/W8bn6ZAocWKFuicjtjesv.png)

First we compare ZAYA1-8B to the SOTA Qwen3 and Qwen3.5 model series of approximately the same parameter count as well as the recently released Gemma4 models and secondly to a variety of larger open-weights models.

### In-class comparison against open-source reasoning models

| Category | Benchmark | ZAYA1-8B<br>(0.7B / 8.0B) | Qwen3-4B-Thinking-2507<br>(4.0B / 4.0B) | Qwen3.5-4B<br>(4.0B / 4.0B) | Gemma-4-E4B-it<br>(4.0B / 8.0B*) |
|---|---|---:|---:|---:|---:|
| Math | AIME'26 | 89.1 | 77.5 | 84.5 | 50.3 |
| Math | HMMT Feb.'26 | 71.6 | 60.8 | 63.6 | 32.1 |
| Math | IMO-AnswerBench | 59.3 | 50.9 | 48.7 | 27.3 |
| Math | APEX-shortlist | 32.2 | 16.9 | -- | 6.1 |
| Code | LiveCodeBench-v6 | 65.8 | 54.2 | -- | 54.2 |
| Knowledge | GPQA-Diamond | 71.0 | 66.5 | 76.2 | 57.4 |
| Knowledge | MMLU-Pro | 74.2 | 74.3 | 79.1 | 70.2 |
| Instruction | IFEval | 85.58 | 86.8 | 89.8 | 88.50 |
| Instruction | IFBench | 52.56 | 52.9 | 59.2 | 42.67 |
| Style & chat | EQBench | 72.95 | 79.6 | 79.5 | 80.15 |
| Style & chat | Creative Writing v3 | 62.97 | 58.6 | 72.9 | 83.75 |
| Agentic | BFCL-v4 | 39.22 | 49.7 | 45.2 | 31.7 |
| Agentic | τ² | 43.12 | 52.9 | 82.1 | 37.7 |


### Scaling comparison against larger open-source reasoning models


| Model | Active | Total | AIME'26 | HMMT'26 | LCB-v6 | IFEval | GPQA-D | MMLU-Pro |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ZAYA1-8B | 0.7B | 8B | 89.1 | 71.6 | 63.8 | 85.8 | 71.0 | 74.2 |
| Arcee-Trinity-Mini | 3B | 26B | 59.6 | 36.9 | 33.3 | 62.0 | 46.8 | 70.6 |
| N3-Nano-30B | 3B | 30B | 90.1 | 75.5 | 64.6 | 92.8 | 75.1 | 78.9 |
| OLMo-3.1-32B-Think | 32B | 32B | 78.9 | 50.6 | 58.3 | 93.2 | 59.6 | 75.8 |
| Qwen3-Next-80B-A3B-Think | 3B | 80B | 90.2 | 79.3 | 67.8 | 88.5 | 76.7 | 82.6 |
| Intellect-3 | 12B | 106B | 86.3 | 72.2 | 66.8 | 81.2 | 74.6 | 82.3 |
| Mistral-Small-4-119B | 6B | 119B | 86.4 | 70.6 | 57.9 | 84.0 | 77.2 | 81.6 |


All numbers are run on the Zyphra evaluation harness. Models are ordered by total parameter count.


## Quickstart
### Prerequisites
We recommend installing the following libraries in a fresh python environment (tested with python 3.12).

To use ZAYA1-8B, install `zaya1-pr` branch from our fork of `vllm` library (the command will trigger a full build of vLLM from source):  
```bash
pip install "vllm @ git+https://github.com/Zyphra/vllm.git@zaya1-pr"
```

If you want to run in transformers, install `zaya1` branch from our fork of `transformers` library as well: 
```bash
pip install "transformers @ git+https://github.com/Zyphra/transformers.git@zaya1"
```

### Deployment
To start vLLM server, run the following command:
```bash
vllm serve Zyphra/ZAYA1-8B --port 8010 \
   --mamba-cache-dtype float32 --dtype bfloat16 \
   --reasoning-parser qwen3 --enable-auto-tool-choice --tool-call-parser zaya_xml
```
For parallel deployment we recommend using DP with EP as TP for CCA is not supported in the branch above. If running on 8 GPUs, set extra flags `-dp 8 -ep` to run with DP=EP=8.

For our evaluations and for general use, we recommend temperature 1.0, top-p 0.95, top-k -1. For agent and code use cases, we recommend temperature 0.6, top-p 0.95, top-k -1.

Once the server is up, you can query a model with `curl` like in the following example:
```bash
curl http://localhost:8010/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "Zyphra/ZAYA1-8B",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello. How is it going?"}
        ]
    }'
```
