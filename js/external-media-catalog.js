(function exposeExternalMediaCatalog(root) {
  root.LOCAL_AI_EXTERNAL_MEDIA = {
    image: {
      'flux-2-klein-4b': {
        kind: 'image',
        items: [
          { kind: 'image', url: 'https://raw.githubusercontent.com/black-forest-labs/flux2/main/assets/t2i_klein_realism.jpg', alt: 'Official FLUX.2 Klein realism examples', caption: 'Text-to-image realism' },
          { kind: 'image', url: 'https://raw.githubusercontent.com/black-forest-labs/flux2/main/assets/t2i_klein_others.jpg', alt: 'Official FLUX.2 Klein output diversity examples', caption: 'Output diversity' },
          { kind: 'image', url: 'https://raw.githubusercontent.com/black-forest-labs/flux2/main/assets/i2i_klein.jpg', alt: 'Official FLUX.2 Klein image editing examples', caption: 'Image editing' }
        ],
        sourceLabel: 'FLUX.2 official repository', sourceUrl: 'https://github.com/black-forest-labs/flux2'
      },
      'flux-1-schnell': {
        kind: 'image',
        items: [
          { kind: 'image', url: 'https://raw.githubusercontent.com/black-forest-labs/flux/main/assets/schnell_grid.jpg', alt: 'Official FLUX.1 Schnell output grid', caption: 'FLUX.1 Schnell outputs' },
          { kind: 'image', url: 'https://cdn.sanity.io/images/2gpum2i6/production/4fc13384ce864f0b922e59b738babaa897428b74-2500x1750.png', alt: 'Official Black Forest Labs FLUX.1 family showcase', caption: 'FLUX.1 family showcase' },
          { kind: 'image', url: 'https://cdn.sanity.io/images/2gpum2i6/production/76bc98bc6fdb4166fe93bfb439bb5d2e089762b7-1536x864.png', alt: 'Official FLUX.1 aspect ratio examples', caption: 'FLUX.1 aspect ratios' }
        ],
        sourceLabel: 'Black Forest Labs official showcase', sourceUrl: 'https://bfl.ai/blog/24-08-01-bfl'
      },
      'stable-diffusion-3.5-medium': {
        kind: 'image',
        items: [
          { kind: 'image', url: 'https://images.squarespace-cdn.com/content/v1/6213c340453c3f502425776e/9746d34b-4302-446f-a2aa-32f94cd0ad33/hero_img_sd3.5.jpg?format=1500w', alt: 'Official Stable Diffusion 3.5 showcase', caption: 'Stable Diffusion 3.5 showcase' },
          { kind: 'image', url: 'https://images.squarespace-cdn.com/content/v1/6213c340453c3f502425776e/3c9a05b4-aa10-4a46-882e-1c32ac7bf18e/diverse_sd3.5.jpg?format=1500w', alt: 'Official Stable Diffusion 3.5 diverse output examples', caption: 'Diverse outputs' },
          { kind: 'image', url: 'https://images.squarespace-cdn.com/content/v1/6213c340453c3f502425776e/38fa9269-fc25-4a17-b46c-f9f0b9b6b76a/versatile_sd3.5.jpg?format=1500w', alt: 'Official Stable Diffusion 3.5 style examples', caption: 'Versatile styles' }
        ],
        sourceLabel: 'Stability AI official SD3.5 release', sourceUrl: 'https://stability.ai/news/introducing-stable-diffusion-3-5'
      },
      'qwen-image-2512': {
        kind: 'image',
        items: [
          { kind: 'image', url: 'https://qianwen-res.oss-accelerate-overseas.aliyuncs.com/Qwen-Image/image2512/image2512big.png', alt: 'Official Qwen Image 2512 output showcase', caption: 'Qwen Image 2512 showcase' },
          { kind: 'image', url: 'https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-Image/image2512/%E5%B9%BB%E7%81%AF%E7%89%871.JPG', alt: 'Official Qwen Image 2512 realistic portrait comparison', caption: 'Realistic people and prompt adherence' },
          { kind: 'image', url: 'https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-Image/image2512/%E5%B9%BB%E7%81%AF%E7%89%872.JPG', alt: 'Official Qwen Image 2512 natural detail comparison', caption: 'Natural detail' }
        ],
        sourceLabel: 'Qwen Image official repository', sourceUrl: 'https://github.com/QwenLM/Qwen-Image'
      },
      'sdxl-base-1.0': {
        kind: 'image',
        items: [
          { kind: 'image', url: 'https://images.squarespace-cdn.com/content/v1/6213c340453c3f502425776e/c6d4be29-8502-402b-8ccc-1a5f28d59fe2/sdxl_horizontal2.png?format=1500w', alt: 'Official Stable Diffusion XL output examples', caption: 'SDXL output examples' },
          { kind: 'image', url: 'https://images.squarespace-cdn.com/content/v1/6213c340453c3f502425776e/cc1b0eab-ed11-4af9-bde5-f62bbc3b728d/sdxl_horizontal3.png?format=1500w', alt: 'Official Stable Diffusion XL style examples', caption: 'Style range' },
          { kind: 'image', url: 'https://images.squarespace-cdn.com/content/v1/6213c340453c3f502425776e/1a31bba2-829f-4939-a398-d65d546f9eb8/sdxl_refiner_horizontal_stack.png?format=1500w', alt: 'Official Stable Diffusion XL base and refiner examples', caption: 'Base and refiner pipeline' }
        ],
        sourceLabel: 'Stability AI official SDXL release', sourceUrl: 'https://stability.ai/news-updates/stable-diffusion-sdxl-1-announcement'
      }
    },
    video: {
      'ltx-video': { kind: 'image', url: 'https://media.githubusercontent.com/media/Lightricks/LTX-Video/main/docs/_static/ltx-video_i2v_example_00001.gif', alt: 'Official LTX-Video image-to-video example', sourceLabel: 'LTX-Video official repository', sourceUrl: 'https://github.com/Lightricks/LTX-Video' },
      'hunyuanvideo-1.5': { kind: 'video', url: 'https://github.com/user-attachments/assets/d45ec78e-ea40-47f1-8d4d-f4d9a0682e2d', alt: 'Official HunyuanVideo 1.5 video example', sourceLabel: 'HunyuanVideo 1.5 official repository', sourceUrl: 'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5' },
      'cogvideox-2b': { kind: 'image', url: 'https://raw.githubusercontent.com/THUDM/CogVideo/CogVideo/assets/intro-image.png', alt: 'Official CogVideoX showcase', sourceLabel: 'CogVideo official repository', sourceUrl: 'https://github.com/THUDM/CogVideo' },
      'wan2.2-ti2v-5b': { kind: 'video', url: 'https://github.com/user-attachments/assets/b63bfa58-d5d7-4de6-a1a2-98970b06d9a7', alt: 'Official Wan2.2 video example', sourceLabel: 'Wan2.2 official repository', sourceUrl: 'https://github.com/Wan-Video/Wan2.2' },
      'mochi-1': { kind: 'video', url: 'https://github.com/user-attachments/assets/4d268d02-906d-4cb0-87cc-f467f1497108', alt: 'Official Mochi 1 video example', sourceLabel: 'Genmo models official repository', sourceUrl: 'https://github.com/genmoai/models' },
      'wan2.1-t2v-1.3b': { kind: 'image', url: 'https://raw.githubusercontent.com/Wan-Video/Wan2.1/main/assets/t2v_res.jpg', alt: 'Official Wan2.1 text-to-video results', sourceLabel: 'Wan2.1 official repository', sourceUrl: 'https://github.com/Wan-Video/Wan2.1' },
      'framepack-f1': { kind: 'image', url: 'https://github.com/user-attachments/assets/8c5cdbb1-b80c-4b7e-ac27-83834ac24cc4', alt: 'Official FramePack animation example', sourceLabel: 'FramePack official repository', sourceUrl: 'https://github.com/lllyasviel/FramePack' },
      'vace-wan2.1-1.3b': { kind: 'image', url: 'https://raw.githubusercontent.com/ali-vilab/VACE/main/assets/materials/teaser.jpg', alt: 'Official VACE video creation showcase', sourceLabel: 'VACE official repository', sourceUrl: 'https://github.com/ali-vilab/VACE' },
      'ltx-video-0.9.8-distilled': { kind: 'image', url: 'https://media.githubusercontent.com/media/Lightricks/LTX-Video/main/docs/_static/ltx-video_i2v_example_00002.gif', alt: 'Official LTX-Video distilled family example', sourceLabel: 'LTX-Video official repository', sourceUrl: 'https://github.com/Lightricks/LTX-Video' },
      'cogvideox-5b': { kind: 'image', url: 'https://raw.githubusercontent.com/THUDM/CogVideo/CogVideo/assets/appendix-sample-highframerate.png', alt: 'Official CogVideoX high frame rate showcase', sourceLabel: 'CogVideo official repository', sourceUrl: 'https://github.com/THUDM/CogVideo' },
      'stable-video-diffusion-xt-1.1': { kind: 'image', url: 'https://raw.githubusercontent.com/Stability-AI/generative-models/main/assets/sv3d.gif', alt: 'Official Stability AI video animation example', sourceLabel: 'Stability AI official repository', sourceUrl: 'https://github.com/Stability-AI/generative-models' },
      'animatediff-sd15': { kind: 'image', url: 'https://raw.githubusercontent.com/guoyww/AnimateDiff/main/__assets__/animations/model_01/01.gif', alt: 'Official AnimateDiff animation example', sourceLabel: 'AnimateDiff official repository', sourceUrl: 'https://github.com/guoyww/AnimateDiff' },
      'videocrafter2': { kind: 'image', url: 'https://img.youtube.com/vi/TUsFkW0tK-s/maxresdefault.jpg', alt: 'Official VideoCrafter2 showcase thumbnail', sourceLabel: 'VideoCrafter official repository', sourceUrl: 'https://github.com/AILab-CVC/VideoCrafter' },
      'dynamicrafter-512': { kind: 'image', url: 'https://img.youtube.com/vi/0NfmIsNAg-g/maxresdefault.jpg', alt: 'Official DynamiCrafter showcase thumbnail', sourceLabel: 'DynamiCrafter official repository', sourceUrl: 'https://github.com/Doubiiu/DynamiCrafter' },
      'wan2.1-i2v-14b-gp': { kind: 'image', url: 'https://raw.githubusercontent.com/Wan-Video/Wan2.1/main/assets/i2v_res.png', alt: 'Official Wan2.1 image-to-video results', sourceLabel: 'Wan2.1 official repository', sourceUrl: 'https://github.com/Wan-Video/Wan2.1' }
    },
    '3d': {
      'stable-fast-3d': { kind: 'image', url: 'https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/demo_files/comp.gif', alt: 'Official Stable Fast 3D comparison example', sourceLabel: 'Stable Fast 3D official repository', sourceUrl: 'https://github.com/Stability-AI/stable-fast-3d' },
      'hunyuan3d-2.1': { kind: 'image', url: 'https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/assets/images/teaser.jpg', alt: 'Official Hunyuan3D 2.1 asset showcase', sourceLabel: 'Hunyuan3D 2.1 official repository', sourceUrl: 'https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1' },
      'trellis-image-large': { kind: 'image', url: 'https://raw.githubusercontent.com/microsoft/TRELLIS/main/assets/teaser.png', alt: 'Official TRELLIS image-to-3D showcase', sourceLabel: 'TRELLIS official repository', sourceUrl: 'https://github.com/microsoft/TRELLIS' },
      'trellis-2': { kind: 'image', url: 'https://raw.githubusercontent.com/microsoft/TRELLIS.2/main/assets/teaser.webp', alt: 'Official TRELLIS.2 showcase', sourceLabel: 'TRELLIS.2 official repository', sourceUrl: 'https://github.com/microsoft/TRELLIS.2' },
      'triposr': { kind: 'image', url: 'https://raw.githubusercontent.com/VAST-AI-Research/TripoSR/main/figures/teaser800.gif', alt: 'Official TripoSR rotating reconstruction example', sourceLabel: 'TripoSR official repository', sourceUrl: 'https://github.com/VAST-AI-Research/TripoSR' },
      'hunyuan3d-2-mini-turbo': { kind: 'image', url: 'https://github.com/user-attachments/assets/efb402a1-0b09-41e0-a6cb-259d442e76aa', alt: 'Official Hunyuan3D 2 mini turbo showcase', sourceLabel: 'Hunyuan3D official repository', sourceUrl: 'https://github.com/Tencent-Hunyuan/Hunyuan3D-2' },
      'hunyuan3d-swift': { kind: 'image', url: 'https://github.com/user-attachments/assets/534826fa-0a79-45f0-a5af-8c69a49e1fe9', alt: 'Official Hunyuan3D Swift showcase', sourceLabel: 'Hunyuan3D official repository', sourceUrl: 'https://github.com/Tencent-Hunyuan/Hunyuan3D-2' },
      'spar3d': { kind: 'image', url: 'https://raw.githubusercontent.com/Stability-AI/stable-point-aware-3d/main/demo_files/turntable.gif', alt: 'Official SPAR3D turntable example', sourceLabel: 'SPAR3D official repository', sourceUrl: 'https://github.com/Stability-AI/stable-point-aware-3d' },
      'triposg': { kind: 'image', url: 'https://raw.githubusercontent.com/VAST-AI-Research/TripoSG/main/assets/doc/triposg_teaser.png', alt: 'Official TripoSG geometry showcase', sourceLabel: 'TripoSG official repository', sourceUrl: 'https://github.com/VAST-AI-Research/TripoSG' },
      'partcrafter': { kind: 'image', url: 'https://raw.githubusercontent.com/wgsxm/PartCrafter/main/assets/teaser.png', alt: 'Official PartCrafter part-aware 3D showcase', sourceLabel: 'PartCrafter official repository', sourceUrl: 'https://github.com/wgsxm/PartCrafter' },
      instantmesh: { kind: 'video', url: 'https://github.com/TencentARC/InstantMesh/assets/20635237/dab3511e-e7c6-4c0b-bab7-15772045c47d', alt: 'Official InstantMesh 3D reconstruction example', sourceLabel: 'InstantMesh official repository', sourceUrl: 'https://github.com/TencentARC/InstantMesh' },
      'crm': { kind: 'image', url: 'https://github.com/thu-ml/CRM/assets/40787266/4354d22a-a641-4531-8408-c761ead8b1a2', alt: 'Official CRM reconstruction showcase', sourceLabel: 'CRM official repository', sourceUrl: 'https://github.com/thu-ml/CRM' },
      'wonder3d': { kind: 'image', url: 'https://raw.githubusercontent.com/xxlong0/Wonder3D/main/assets/fig_teaser.png', alt: 'Official Wonder3D multiview showcase', sourceLabel: 'Wonder3D official repository', sourceUrl: 'https://github.com/xxlong0/Wonder3D' },
      dreamgaussian: { kind: 'video', url: 'https://github.com/dreamgaussian/dreamgaussian/assets/25863658/db860801-7b9c-4b30-9eb9-87330175f5c8', alt: 'Official DreamGaussian 3D content example', sourceLabel: 'DreamGaussian official repository', sourceUrl: 'https://github.com/dreamgaussian/dreamgaussian' },
      'shap-e': { kind: 'image', url: 'https://raw.githubusercontent.com/openai/shap-e/main/samples/a_chair_that_looks_like_an_avocado/2.gif', alt: 'Official Shap-E generated 3D example', sourceLabel: 'Shap-E official repository', sourceUrl: 'https://github.com/openai/shap-e' },
      'trellis-text-base': { kind: 'image', url: 'https://raw.githubusercontent.com/microsoft/TRELLIS/main/assets/teaser.png', alt: 'Official TRELLIS family 3D showcase', sourceLabel: 'TRELLIS official repository', sourceUrl: 'https://github.com/microsoft/TRELLIS' },
      'openlrm': { kind: 'image', url: 'https://raw.githubusercontent.com/3DTopia/OpenLRM/main/assets/rendered_video/teaser.gif', alt: 'Official OpenLRM rotating reconstruction example', sourceLabel: 'OpenLRM official repository', sourceUrl: 'https://github.com/3DTopia/OpenLRM' }
    },
    voice: {
      'qwen3-tts': { kind: 'audio', url: 'https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen3-TTS-Repo/clone.wav', alt: 'Official Qwen3-TTS audio example', sourceLabel: 'Qwen3-TTS official repository', sourceUrl: 'https://github.com/QwenLM/Qwen3-TTS' },
      'higgs-audio-v2': { kind: 'audio', url: 'https://huggingface.co/datasets/eustlb/dummy-audio-samples-higgs/resolve/main/belinda.wav', alt: 'Official Higgs Audio V2 model card example', sourceLabel: 'Higgs Audio V2 official model card', sourceUrl: 'https://huggingface.co/bosonai/higgs-audio-v2-generation-3B-base' },
      kokoro: { kind: 'audio', url: 'https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/samples/af_heart_0.wav', alt: 'Official Kokoro audio example', sourceLabel: 'Kokoro official model card', sourceUrl: 'https://huggingface.co/hexgrad/Kokoro-82M' },
      'supertonic-3': { kind: 'audio', url: 'https://huggingface.co/Supertone/supertonic-3/resolve/main/audio_samples/alphonse_supertonic3.wav', alt: 'Official Supertonic 3 audio example', sourceLabel: 'Supertonic 3 official model card', sourceUrl: 'https://huggingface.co/Supertone/supertonic-3' },
      'neutts-air': { kind: 'audio', url: 'https://raw.githubusercontent.com/neuphonic/neutts-air/main/output.wav', alt: 'Official NeuTTS Air repository audio example', sourceLabel: 'NeuTTS Air official repository', sourceUrl: 'https://github.com/neuphonic/neutts-air' },
      'dia-tts': { kind: 'audio', url: 'https://raw.githubusercontent.com/nari-labs/dia/main/example_prompt.mp3', alt: 'Official Dia repository audio example', sourceLabel: 'Dia official repository', sourceUrl: 'https://github.com/nari-labs/dia' },
      'openvoice-v2': { kind: 'audio', url: 'https://raw.githubusercontent.com/myshell-ai/OpenVoice/main/resources/demo_speaker0.mp3', alt: 'Official OpenVoice repository audio example', sourceLabel: 'OpenVoice official repository', sourceUrl: 'https://github.com/myshell-ai/OpenVoice' }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
