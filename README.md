# 榨干一张 MI50 · MV

**MI50老矣 尚能饭否**

一部讲解 LLM 推理优化的 Remotion 动画短片：五章、三十多个场景，从一张 2018 年的 AMD Radeon Instinct MI50 的基本架构讲起，到 LLM 推理的基本概念，再按真实的优化顺序一步步讲到 DSpark。目标观众是学过计算机组成和操作系统的本科生。

1920×1080 / 60fps，时间轴驱动；一套代码同时出「渲染成片」和「网页实时版」，配乐由脚本按时间轴程序化生成。

这个分支（`lfm3-mi50`）沿用 `main` 分支《现代密码学 MV》的引擎、字体、人物和配乐生成器，内容全部重写。

![封面](assets/cover.png)

画面是灰白黑「纸与墨」的极简像素风，语气是工程记录；概念场景标注**年份 · 作者 · 论文**，优化步骤标注**日期**，页眉有一条进度标尺和一块记分牌，记录当时 128k 上下文的首 token 时间和解码速度。**所有数字都来自真实测量**，数据和完整报告见 [`pub-lfm3-1.7b-mi50/docs/OPTIMIZATION_REPORT.md`](https://github.com/jwyjohn/lfm3-1.7b-mi50/blob/dspark/docs/OPTIMIZATION_REPORT.md)。

## 效果预览

| 片头 | GPU 架构 |
|---|---|
| ![片头](assets/screenshots/00-intro.jpg) | ![CU](assets/screenshots/01-chip.jpg) |

| KV cache 与物理上限 | 把等待叠在一起 |
|---|---|
| ![KV](assets/screenshots/02-kv.jpg) | ![重叠](assets/screenshots/03-overlap.jpg) |

| 踩坑记录：快，但全错了 | 直连驱动 |
|---|---|
| ![崩坏](assets/screenshots/04-collapse.jpg) | ![KFD](assets/screenshots/05-stack.jpg) |

| DSpark drafter | 这个中位数是抽签 |
|---|---|
| ![DSpark](assets/screenshots/06-drafter.jpg) | ![混沌](assets/screenshots/07-chaos.jpg) |

## 内容

| 章 | 内容 |
|---|---|
| 序 | 片头（`generate("hello")` 等了 238 秒）· 总览 |
| I 一张卡 | CU、SIMD、wave、block · 存储层级（寄存器、LDS、L2、HBM2 的实测）· `v_dot4` 与 `v_dot2` · Roofline 与功耗墙 |
| II 一个模型 | 生成循环、prefill 与 decode · 24 层结构 · Q/K/V、GQA、RoPE · KV cache 与 311 tok/s 的物理上限 · 两种瓶颈 · 量化与 KL |
| III 先跑对 | 238 秒的起点 · megakernel · Flash attention · W8A8 GEMM · **案例：快，但全错了** · 精度方案 · 把等待叠在一起 |
| IV 脱掉外壳 | 直连 KFD、AQL 队列 · L2 回写与 agent scope · **案例：第 0 层的旧值** · **案例：偶尔卡死的启动** · 单文件与体积 |
| V 猜 | draft 与 verify，`tok/s = τ / R` · DSpark drafter · 一轮的账单 · 离屋顶多远 · 逐项账单 · **案例：int8 的价格** · **案例：这个中位数是抽签** · 越过 block 边界 |
| 尾 | 七天的结果 · 还没解决的问题 · 致谢 |

讲解顺序就是优化发生的顺序。每个优化都讲清楚三件事：为什么慢、改了什么、量出来多少。失败和错误也保留：第三章的崩坏、第五章的混沌，都是实际发生过的。

## 工程结构

```
src/
  Root.tsx Main.tsx       Composition（cast: ba / classic）
  timeline.ts             镜头表：五章的场景、节奏档位；自动计算真实时长与音效时刻
  cites.ts                每个场景的 {year, who, work}、各章里程碑、记分牌
  theme.ts                纸与墨的配色 token、像素字体、6px 网格、缓动与量化工具
  components/             Shot（转场 + 时间映射）· ui（页眉 / 旁白 / 进度标尺 / 记分牌）· Problem（案例页）
                          ActTitle（章标题）· pixel（像素面板 / 精灵 / 方块光标）· kit
  scenes/                 lib（绘图原语）· hw · llm · run · go · ds · ds2 · Intro · fin
web/                      网页实时版（Remotion Player，可切换两套人物）
audio/make_music.py       8-bit 配乐生成；audio/timeline.json 为导出的时间轴（可再生）
scripts/                  时间轴导出 · 静帧 / 拼图 · 批量渲染 · 符号字体生成 · 字形检查
public/                   渲染用静态资源（字体、人物精灵、配乐 mp3）
web-public/               网页版静态资源
assets/screenshots/       README 截图
```

节奏档位、转场、配色、字体约定都和 `main` 分支相同：A 核心 0.75× · B 标准 0.88× · C 利落 1.0× · 章标题 0.67× · 首尾 0.85×；每个场景最多 3 个关键时刻自动放慢；只用 `COL.*` 语义色，唯一强调色是表示错误的红；坐标对齐 6px 网格；全部像素字体。

## 人物

| 角色 | 人物（`cast: 'ba'`） |
|---|---|
| drafter（负责猜） | 才羽桃井 |
| verifier（负责验证） | 才羽绿 |
| 算账的人（Roofline、功耗） | 早濑优香 |
| 研究者（查根因、下结论） | 天童爱丽丝 |
| 工程师（驱动） | 花冈柚子 |

人物精灵取自 pixiv #95092393（"Game Development Department" 像素立绘），按原生分辨率裁切、去背景，嵌入在 `src/components/sprites_data.ts`。**该图为他人作品，公开发布前请取得作者授权并署名**；`cast: 'classic'` 的版本使用原版单色像素小人，不含该素材。

## 配乐

沿用 `audio/make_music.py`：Pachelbel《D 大调卡农》（公有领域）的 8-bit 编配。全片一条连续的卡农，段落之间只改变密度，各章升调，场景里的 cue 映射为芯片音效。

## 快速开始

```bash
npm install
npm run studio          # Remotion Studio 预览
npm run web:dev         # 网页实时版
```

配乐（需要 Python）：

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy soundfile fonttools brotli pillow
npm run music           # 导出时间轴并生成 public/music.wav
npm run audio:mp3       # 转出 mp3（网页版用）
```

## 渲染

```bash
bash scripts/render_all.sh                    # 两个版本 → out/MI50_MV{,_classic}.mp4
npm run render                                # 仅游戏开发部人物版
bash scripts/sheet.sh name hw_chip:800 go_l2:600   # 按「镜头:场景帧」渲染静帧并拼图到 out/name.jpg
npx remotion still Cover assets/cover.png --image-format=png   # 封面（1600×1200，4:3）
```

渲染配置在 `remotion.config.ts`（h264 / crf 17 / yuv420p / jpeg 92，并发 8）。本地渲染前先 `npm run music` 生成 `public/music.wav`（母带不进仓库）。

## 不进仓库的内容

`node_modules/`、`.venv/`、`out/`（渲染输出）、`public/*.wav`（母带）。

## 许可

代码同 `main` 分支。Fusion Pixel 和 Press Start 2P 字体按 OFL 授权。人物素材见上文。
