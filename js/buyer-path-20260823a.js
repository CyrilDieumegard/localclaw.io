(function(){
  const roots=document.querySelectorAll('[data-buyer-path]');
  if(!roots.length)return;
  const profiles={
    'buy|chat|starter':[
      ['New pre-order','Mac mini M6 · 24GB','Available September 22. A balanced compact Mac for small local chat, coding and RAG models.','/hardware/mac-mini-m6-24gb','See pre-order fit'],
      ['CUDA alternative','RTX 5060 Ti · 16GB','A practical new NVIDIA floor when faster CUDA inference matters.','/go/amazon?q=RTX+5060+Ti+16GB','Check Amazon'],
      ['More headroom','Desktop · 64GB RAM','A better base for RAG, browsers and several local tools at once.','/ram-gpu-for-local-ai#ram-picks','Compare RAM']
    ],
    'buy|code|starter':[
      ['New pre-order','Mac mini M5 Pro · 24GB','Available September 22. A compact coding workstation with more compute and enough memory for practical assistants.','/hardware/mac-mini-m5-pro-24gb','See pre-order fit'],
      ['CUDA alternative','RTX 5060 Ti · 16GB','Useful for 7B, 9B and some 14B-class coding models with GPU acceleration.','/go/amazon?q=RTX+5060+Ti+16GB','Check Amazon'],
      ['Longer-term','64GB local AI desktop','More room for IDEs, agents, RAG and concurrent services.','/computers','Compare computers']
    ],
    'buy|create|starter':[
      ['Best starting point','RTX 5070 Ti · 16GB','A balanced CUDA choice for local image work and smaller multimodal workflows.','/go/amazon?q=RTX+5070+Ti+16GB','Check Amazon'],
      ['Lower cost','RTX 5060 Ti · 16GB','Keeps 16GB VRAM while reducing the entry cost; expect less speed.','/go/amazon?q=RTX+5060+Ti+16GB','Check Amazon'],
      ['More headroom','RTX 5090 · 32GB','For buyers who need more consumer VRAM and accept flagship cost and power.','/go/amazon?q=RTX+5090+32GB','Check Amazon']
    ],
    'upgrade|chat|starter':[
      ['Best upgrade','64GB system RAM','The practical sweet spot for local chat, RAG and multiple tools when CPU or offload memory is the bottleneck.','/go/amazon?q=DDR5+64GB+2x32GB+6000+CL30','Check Amazon'],
      ['GPU route','RTX 5060 Ti · 16GB','Choose this when tokens per second matter more than system headroom.','/go/amazon?q=RTX+5060+Ti+16GB','Check Amazon'],
      ['Before buying','Check RAM vs VRAM','Confirm which memory pool is actually full before spending.','/ram-gpu-for-local-ai#ram-vs-vram','Open guide']
    ],
    'upgrade|code|starter':[
      ['Best upgrade','64GB system RAM','More room for IDEs, coding agents, browsers, RAG indexes and local services.','/go/amazon?q=DDR5+64GB+2x32GB+6000+CL30','Check Amazon'],
      ['Speed upgrade','RTX 5070 Ti · 16GB','A faster CUDA option for coding models that fit inside 16GB VRAM.','/go/amazon?q=RTX+5070+Ti+16GB','Check Amazon'],
      ['Workstation step-up','96GB system RAM','Useful when 64GB already feels tight under concurrent workloads.','/go/amazon?q=DDR5+96GB+2x48GB+6000','Check Amazon']
    ],
    'upgrade|create|starter':[
      ['Best upgrade','RTX 5070 Ti · 16GB','A balanced consumer CUDA upgrade for image generation and local multimodal tools.','/go/amazon?q=RTX+5070+Ti+16GB','Check Amazon'],
      ['Value option','RTX 5060 Ti · 16GB','The lower-cost 16GB route when raw speed is secondary.','/go/amazon?q=RTX+5060+Ti+16GB','Check Amazon'],
      ['Bigger workloads','RTX 4090 · 24GB','More VRAM for larger local creative workloads; verify used-market risk and power.','/go/amazon?q=RTX+4090+24GB','Check Amazon']
    ]
  };
  const headroomProfiles={
    'buy|chat':[
      ['Best long-term value','Mac Studio M5 Max · 64GB','Available September 22. More unified memory for larger contexts, RAG and several local services without moving to the extreme tier.','/hardware/mac-studio-m5-max-64gb','See pre-order fit'],
      ['CUDA workstation','RTX 5090 · 32GB','The largest current consumer NVIDIA VRAM tier for buyers who also want strong CUDA speed.','/go/amazon?q=RTX+5090+32GB','Check Amazon'],
      ['Maximum memory','Ryzen AI Max · 128GB','A unified-memory route for large quantized workloads when CUDA is not mandatory.','/computers','Compare computers']],
    'buy|code':[
      ['Best long-term value','Mac Studio M5 Max · 64GB','Available September 22. A balanced local coding and agent workstation with room for tools, contexts and concurrent services.','/hardware/mac-studio-m5-max-64gb','See pre-order fit'],
      ['CUDA route','RTX 5090 · 32GB','Stronger acceleration and more consumer VRAM for larger coding models.','/go/amazon?q=RTX+5090+32GB','Check Amazon'],
      ['More unified memory','Ryzen AI Max · 128GB','Large shared memory for agent stacks and model experimentation without a separate VRAM pool.','/computers','Compare computers']],
    'buy|create':[
      ['Best creator route','RTX 5090 · 32GB','Maximum consumer NVIDIA VRAM for demanding local image and multimodal workflows.','/go/amazon?q=RTX+5090+32GB','Check Amazon'],
      ['Balanced alternative','RTX 4090 · 24GB','Still a strong local AI tier when a trustworthy listing and suitable power supply are available.','/go/amazon?q=RTX+4090+24GB','Check Amazon'],
      ['Workstation capacity','RTX PRO · 48GB+','Only for workflows that genuinely exceed consumer VRAM and justify workstation cost.','/ram-gpu-for-local-ai#pro-gpu-picks','Compare PRO tiers']],
    'upgrade|chat':[
      ['Best headroom upgrade','96GB system RAM','A sensible step beyond 64GB for large contexts, RAG indexes and concurrent services.','/go/amazon?q=DDR5+96GB+2x48GB+6000','Check Amazon'],
      ['CUDA capacity','RTX 5090 · 32GB','Choose this when GPU model fit and inference speed are the bottleneck.','/go/amazon?q=RTX+5090+32GB','Check Amazon'],
      ['Maximum desktop RAM','128GB system RAM','For CPU-side workloads and many concurrent tools; verify motherboard QVL first.','/go/amazon?q=DDR5+128GB+memory+kit','Check Amazon']],
    'upgrade|code':[
      ['Best headroom upgrade','96GB system RAM','More room for large repositories, agent stacks, RAG and local services.','/go/amazon?q=DDR5+96GB+2x48GB+6000','Check Amazon'],
      ['GPU step-up','RTX 5090 · 32GB','More VRAM and speed for larger accelerated coding models.','/go/amazon?q=RTX+5090+32GB','Check Amazon'],
      ['Maximum desktop RAM','128GB system RAM','Useful only when the board supports it and 96GB is genuinely constrained.','/go/amazon?q=DDR5+128GB+memory+kit','Check Amazon']],
    'upgrade|create':[
      ['Best headroom upgrade','RTX 5090 · 32GB','The strongest consumer capacity route for demanding local creative workflows.','/go/amazon?q=RTX+5090+32GB','Check Amazon'],
      ['Value at 24GB','RTX 4090 · 24GB','A strong alternative when sourced carefully and paired with adequate power and cooling.','/go/amazon?q=RTX+4090+24GB','Check Amazon'],
      ['Beyond consumer VRAM','RTX PRO · 48GB+','For professional workloads that truly exceed 32GB, not as a default recommendation.','/ram-gpu-for-local-ai#pro-gpu-picks','Compare PRO tiers']]
  };
  function track(name,props){if(typeof window.datafast==='function')window.datafast(name,props)}
  roots.forEach(root=>{
    const result=root.querySelector('[data-buyer-result]'),cards=root.querySelector('[data-buyer-cards]');
    function render(){
      const values={};root.querySelectorAll('input:checked').forEach(i=>values[i.name]=i.value);
      if(!values.path||!values.use||!values.budget)return;
      const list=values.budget==='headroom'?(headroomProfiles[`${values.path}|${values.use}`]||headroomProfiles['buy|chat']):(profiles[`${values.path}|${values.use}|starter`]||profiles['buy|chat|starter']);
      cards.innerHTML=list.map((x,i)=>`<article class="lc-buyer__card"><span class="lc-buyer__badge">${i?'Alternative '+i:'Primary recommendation'}</span><h3>${x[1]}</h3><p>${x[2]}</p><a class="${i?'secondary':''}" href="${x[3]}" ${x[3].startsWith('/go/')?'target="_blank" rel="sponsored nofollow noopener"':''} data-fast-goal="${x[3].startsWith('/go/')?'amazon_click':'buyer_recommendation_click'}" data-fast-goal-source="buyer_path">${x[4]}</a></article>`).join('');
      result.hidden=false;track('buyer_recommendation_viewed',{path:values.path,use_case:values.use,budget:values.budget});
    }
    root.addEventListener('change',()=>{track('buyer_path_answered',{step:'choice'});render()});render();
  });
})();
