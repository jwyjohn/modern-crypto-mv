/**
 * Short version: every algorithm of the film, chapter by chapter, in historical/logical order.
 * Each node says what it achieves (`does`) and which question it leaves open (`next`) — the thread that
 * leads to the following node. `shot` names the full-version shot whose scene supplies a short excerpt.
 */
export type ChainNode = {year: string; name: string; does: string; next: string; shot: string};

export const CHAINS: {num: string; core: string; nodes: ChainNode[]}[] = [
  {
    num: '01',
    core: '双方共享一把钥匙，安全只取决于钥匙',
    nodes: [
      {year: '1917 · 1949', name: '一次一密', does: '密文不泄露明文的任何信息（完美保密）', next: '但密钥必须和消息一样长', shot: 'sym_otp'},
      {year: '1943', name: '两次一密', does: '密钥复用，两条明文同时暴露', next: '真随机太贵 → 用短密钥生成伪随机', shot: 'sym_p_twotime'},
      {year: '1977 · 2001', name: '分组密码 DES → AES', does: '短密钥驱动的伪随机置换，多轮混淆与扩散', next: '它真的"够乱"吗？', shot: 'sym_aes'},
      {year: '1990 · 1993', name: '差分与线性分析', does: '统计偏差在多轮中累积，足以恢复密钥', next: 'S 盒与轮数必须抵抗它们', shot: 'sym_diff'},
      {year: '1997', name: '代数攻击', does: '把密码写成方程组，用 Gröbner 基求解', next: '代数次数太低就危险', shot: 'sym_p_algebraic'},
      {year: '1980', name: '工作模式', does: 'ECB 泄露结构，CBC / CTR 需要随机 IV', next: '机密性 ≠ 完整性', shot: 'sym_modes'},
      {year: '1979', name: '哈希与生日界', does: 'n 位哈希约 2^(n/2) 次就会碰撞', next: '还要能发现篡改', shot: 'sym_p_birthday'},
      {year: '2000 · 2002', name: '认证加密与填充谕言', does: '先加密后 MAC；一比特泄露足以逐字节解密', next: '共享钥匙从哪里来？', shot: 'sym_ae'},
    ],
  },
  {
    num: '02',
    core: '陌生人也能在公开信道上约定秘密',
    nodes: [
      {year: '1801', name: '循环群与离散对数', does: 'g^x 容易，反过来求 x 很难', next: '能用这种不对称交换秘密吗？', shot: 'pk_group'},
      {year: '1976', name: 'Diffie–Hellman', does: '公开交换 g^a、g^b，双方得到同一个 g^ab', next: '能不能直接加密、签名？', shot: 'pk_dh'},
      {year: '1977', name: 'RSA', does: '陷门置换：只有知道分解的人能求逆', next: '教科书 RSA 是确定性的', shot: 'pk_p_rsa'},
      {year: '1985', name: 'Håstad 广播攻击', does: '同一明文发给三人，CRT 直接还原', next: '必须加随机填充', shot: 'pk_p_hastad'},
      {year: '1985', name: '椭圆曲线', does: '同等安全，密钥短得多', next: '如何把这些拼成真实协议？', shot: 'pk_ecc'},
      {year: '2018', name: 'TLS 1.3', does: 'ECDHE 协商 + 签名认证 + AEAD 加密', next: '怎么确认对方的身份？', shot: 'pk_tls'},
    ],
  },
  {
    num: '03',
    core: '只有持钥人能签，所有人都能验',
    nodes: [
      {year: '1988', name: 'EUF-CMA', does: '见过任意多签名，仍造不出新的', next: '用什么构造？', shot: 'sig_euf'},
      {year: '1979', name: 'Lamport 一次签名', does: '只靠单向哈希就能签名', next: '同一把钥匙签两次就可伪造', shot: 'sig_lamport'},
      {year: '1979', name: 'Merkle 树', does: '把许多一次性钥匙收进一个根', next: '能否更短、更高效？', shot: 'sig_merkle'},
      {year: '1986 · 1989', name: 'Fiat–Shamir 与 Schnorr', does: '交互证明里的挑战换成哈希，就成了签名', next: '随机数复用，私钥即泄露（2010）', shot: 'sig_schnorr'},
      {year: '2001', name: 'BLS 与配对', does: '签名可聚合、可门限', next: '"证明"本身还能做什么？', shot: 'sig_bls'},
    ],
  },
  {
    num: '04',
    core: '证明你知道，而不泄露你知道的东西',
    nodes: [
      {year: '1985', name: '交互证明与零知识', does: '作弊成功率每轮减半；验证者学不到任何东西', next: '哪些命题能这样证明？', shot: 'zk_cave'},
      {year: '1986', name: '图同构', does: '所有 NP 命题都有零知识证明', next: '有没有通用、高效的模板？', shot: 'zk_gi'},
      {year: '1989 · 1996', name: 'Σ 协议', does: '完备 · 特殊可靠 · 诚实验证者零知识', next: '去掉交互要小心', shot: 'zk_sigma'},
      {year: '2012', name: 'Fiat–Shamir 的陷阱', does: '哈希漏掉陈述，就能伪造证明', next: '如何验证巨大的计算？', shot: 'zk_p_fs'},
      {year: '1990', name: 'Sumcheck', does: '巨大求和只需少量随机检查', next: '证明能不能极短？', shot: 'zk_sumcheck'},
      {year: '2016', name: 'SNARK', does: '几百字节的证明，毫秒级验证', next: '量子计算机来了怎么办？', shot: 'zk_snark'},
    ],
  },
  {
    num: '05',
    core: '抵御量子计算，并在不看数据的情况下计算',
    nodes: [
      {year: '1994 · 2005', name: 'Shor 与 LWE', does: '量子算法打破 RSA / DH / ECC；加噪声的线性方程抵御它', next: '加密之外，签名呢？', shot: 'fr_lwe'},
      {year: '2009 · 2024', name: '格签名 ML-DSA', does: '带拒绝的 Fiat–Shamir，抗量子签名', next: '算法安全，实现也安全吗？', shot: 'fr_dilithium'},
      {year: '1999 · 2001', name: '侧信道与掩码', does: '功耗泄密；把每个中间值拆成随机份额', next: '份额的思想还能走多远？', shot: 'fr_masking'},
      {year: '1979', name: '秘密共享', does: 't 份可以恢复，少于 t 份一无所知', next: '能在份额上直接计算吗？', shot: 'fr_p_shamir'},
      {year: '1986', name: '安全多方计算', does: '多方联合计算，只得到结果', next: '只想查一条记录呢？', shot: 'fr_mpc'},
      {year: '1995', name: '隐私信息检索', does: '查询数据库，而不暴露查的是哪一条', next: '发布统计数字呢？', shot: 'fr_pir'},
      {year: '2006', name: '差分隐私', does: '加入受控噪声，统计不暴露个人', next: '最终极的：在密文上计算', shot: 'fr_dp'},
      {year: '2009', name: '全同态加密', does: '云端在看不到的数据上完成计算', next: '', shot: 'fr_fhe'},
    ],
  },
];

/** natural length of a digest shot: intro beat + 6 s per node + closing beat (scene frames) */
export const digestFrames = (n: number) => 360 + n * 360 + 240;
