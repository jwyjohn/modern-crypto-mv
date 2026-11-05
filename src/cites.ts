/** Who did it, when, and where: shown as a citation line on every step of the film,
 *  on case cards, and as milestones on each chapter title. `year` is a year for published work
 *  and a date (MM-DD, 2026) for a step of this project. */
export type Cite = {year: number | string; who: string; work: string};

export const CITES: Record<string, Cite> = {
  hw_chip: {year: 2018, who: 'AMD', work: 'Radeon Instinct MI50 · Vega 20（gfx906）· 7 nm'},
  hw_mem: {year: 2018, who: 'AMD', work: 'HBM2 32 GB · 带宽为本卡实测'},
  hw_band: {year: 2018, who: 'AMD', work: 'HBM2 4 堆叠 · 4096-bit · 本卡实测'},
  hw_dot: {year: 2018, who: 'AMD', work: 'Vega ISA · v_dot2 / v_dot4 点积指令'},
  hw_roof: {year: 2009, who: 'S. Williams, A. Waterman & D. Patterson', work: 'Roofline: An Insightful Visual Performance Model'},

  llm_loop: {year: 2017, who: 'A. Vaswani 等', work: 'Attention Is All You Need'},
  llm_layers: {year: 2026, who: 'Liquid AI', work: 'LFM3-1.7B · 卷积与注意力混合的 24 层'},
  llm_attn: {year: 2023, who: 'Vaswani 2017 · Su 2021 · Ainslie 2023', work: 'Attention · RoPE · GQA'},
  llm_kv: {year: 2023, who: 'W. Kwon 等', work: 'Efficient Memory Management for LLM Serving with PagedAttention'},
  llm_cost: {year: 2009, who: 'S. Williams 等', work: 'Roofline：每读 1 字节做几次运算'},
  llm_quant: {year: 2018, who: 'B. Jacob 等', work: 'Quantization for Efficient Integer-Arithmetic-Only Inference'},

  run_base: {year: '10-29', who: '本项目', work: 'vLLM on gfx906 的起点'},
  run_mega: {year: '10-30', who: '本项目', work: 'megakernel：一次 launch 跑完全部层'},
  run_flash: {year: 2022, who: 'T. Dao 等', work: 'FlashAttention: Fast and Memory-Efficient Exact Attention'},
  run_gemm: {year: 2008, who: 'K. Goto & R. van de Geijn', work: 'Anatomy of High-Performance Matrix Multiplication'},
  run_p_collapse: {year: '10-31', who: '本项目', work: '长上下文输出崩坏的根因'},
  run_fix: {year: '10-31', who: '本项目', work: '精度方案：只用 fp16 和 int8'},
  run_overlap: {year: '10-31', who: '本项目', work: '把等待和读内存叠在一起'},
  run_gemv: {year: '11-03', who: '本项目', work: 'GEMV 贴着带宽上限读'},

  go_stack: {year: '11-02', who: '本项目', work: 'Go 直连 KFD，一个静态 ELF'},
  go_l2: {year: '11-02', who: '本项目', work: 'agent scope fence 与不经缓存的主机内存'},
  go_p_race: {year: '11-02', who: '本项目', work: 'decode 内核的 h_old 预取竞争'},

  ds_idea: {year: 2023, who: 'Y. Leviathan, M. Kalman & Y. Matias', work: 'Fast Inference from Transformers via Speculative Decoding'},
  ds_drafter: {year: '11-02', who: 'DSpark', work: '3 层 attention + Markov head + confidence head'},
  ds_round: {year: '11-03', who: '本项目', work: 'draft 和 verify 写进同一个 megakernel'},
  ds_roof: {year: '11-04', who: '本项目', work: '离 roofline 还有多远'},
  ds_tricks: {year: '11-04', who: '本项目', work: '每轮耗时的逐项账单'},
  ds_p_int8: {year: '11-04', who: '本项目', work: 'GEMV 的 x 从 fp16 改为 int8'},
  ds_p_chaos: {year: '11-05', who: '本项目', work: 'τ 是混沌的，比较要换方法'},
  ds_cross: {year: '11-05', who: '本项目', work: 'verify 跨过 block 边界'},
};

/** a credit for work the film relies on without a scene of its own */
export const EXTRA_CREDITS: Cite[] = [
  {year: 2016, who: 'J. L. Ba, J. R. Kiros & G. E. Hinton', work: 'Layer Normalization'},
  {year: 2019, who: 'B. Zhang & R. Sennrich', work: 'Root Mean Square Layer Normalization'},
  {year: 2021, who: 'J. Su 等', work: 'RoFormer: Enhanced Transformer with Rotary Position Embedding'},
  {year: 2023, who: 'J. Ainslie 等', work: 'GQA: Training Generalized Multi-Query Transformer Models'},
  {year: 2023, who: 'C. Chen 等', work: 'Accelerating Large Language Model Decoding with Speculative Sampling'},
  {year: 2024, who: 'nlzy · mixa3607 · gfx906 社区', work: '让已经不被支持的 gfx906 继续跑 ROCm、PyTorch 和 vLLM'},
  {year: 2025, who: 'DeepSeek', work: 'DeepGEMM'},
  {year: 2025, who: 'nick413-bit', work: 'gfx906-fa-vllm：分页 FlashAttention 内核'},
  {year: 2026, who: 'NVIDIA', work: 'Open-SWE-Traces：评测用的真实 agent 轨迹'},
];

export const MILESTONES: Record<string, [string, string][]> = {
  '01': [
    ['60 CU', '共用一条路'],
    ['1024 GB/S', '理论'],
    ['785 GB/S', '实测'],
    ['47 TOPS', '计算很富余'],
    ['178 W', '内存用掉 174 W'],
  ],
  '02': [
    ['1.76 GB', '权重'],
    ['0.81 GB', '128k 的 K/V'],
    ['2.57 GB', '每个 token'],
    ['3.2 MS', '最快也要这么久'],
    ['311', 'tok/s 上限'],
  ],
  '03': [
    ['21%', '起点'],
    ['29%', '更少的字节'],
    ['错', '读少了就错'],
    ['2.57 GB', '不能再少'],
    ['55%', '正确的基线'],
  ],
  '04': [
    ['66%', '叠起等待'],
    ['770 GB/S', 'GEMV'],
    ['0.9 MS', '省掉 L2 回写'],
    ['68%', '直连驱动'],
    ['32%', '还闲着'],
  ],
  '05': [
    ['τ / R', '一条公式'],
    ['M', '一份字节验几个'],
    ['1.35 GB', '每个 token'],
    ['72', '条流才算数'],
    ['334', 'tok/s'],
  ],
};

export const CASE_ORDER = ['run_p_collapse', 'go_p_race', 'ds_p_int8', 'ds_p_chaos'];

/** the bandwidth account at each step of the story, 128k context; a step keeps the last value set before it.
 *  u = share of the measured 785 GB/s actually read, gb = bytes read per committed token. */
export type Score = {u: number; gb: string; tps: string; bad?: boolean};
const SCORE: Record<string, Score> = {
  run_base: {u: 21, gb: '约 5', tps: '32'},
  run_mega: {u: 29, gb: '约 1.7', tps: '132', bad: true},
  run_fix: {u: 55, gb: '2.57', tps: '167'},
  run_overlap: {u: 66, gb: '2.57', tps: '201'},
  go_l2: {u: 68, gb: '2.57', tps: '208'},
  ds_round: {u: 58, gb: '1.35', tps: '334'},
};

export const scoreAt = (id: string, order: string[]) => {
  const at = order.indexOf(id);
  for (let i = at; i >= 0; i--) if (SCORE[order[i]]) return SCORE[order[i]];
  return undefined;
};
