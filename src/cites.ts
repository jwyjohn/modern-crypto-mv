/** Who did it, when, and where: shown as a citation line on every concept shot,
 *  on problem cards, and as a milestone timeline on each act title. */
export type Cite = {year: number; who: string; work: string};

export const CITES: Record<string, Cite> = {
  sym_otp: {year: 1949, who: 'G. Vernam 1917 · C. Shannon', work: 'Communication Theory of Secrecy Systems'},
  sym_p_twotime: {year: 1943, who: 'Venona 计划', work: '复用的苏联一次性密码本被成批破译'},
  sym_aes: {year: 2001, who: 'J. Daemen & V. Rijmen', work: 'Rijndael → AES（FIPS 197）'},
  sym_diff: {year: 1990, who: 'E. Biham & A. Shamir', work: 'Differential Cryptanalysis of DES-like Cryptosystems'},
  sym_linear: {year: 1993, who: 'M. Matsui', work: 'Linear Cryptanalysis Method for DES Cipher'},
  sym_p_algebraic: {year: 1997, who: 'T. Jakobsen & L. R. Knudsen', work: 'The Interpolation Attack on Block Ciphers（PURE）· Gröbner 基：B. Buchberger 1965'},
  sym_modes: {year: 1980, who: 'NBS / NIST', work: 'FIPS 81: DES Modes of Operation'},
  sym_p_birthday: {year: 1979, who: 'G. Yuval', work: 'How to Swindle Rabin'},
  sym_ae: {year: 2000, who: 'M. Bellare & C. Namprempre', work: 'Authenticated Encryption: Relations among Notions'},
  sym_p_padding: {year: 2002, who: 'S. Vaudenay', work: 'Security Flaws Induced by CBC Padding'},

  pk_dh: {year: 1976, who: 'W. Diffie & M. Hellman', work: 'New Directions in Cryptography'},
  pk_group: {year: 1801, who: 'C. F. Gauss', work: 'Disquisitiones Arithmeticae（原根）'},
  pk_p_rsa: {year: 1977, who: 'R. Rivest, A. Shamir & L. Adleman', work: 'A Method for Obtaining Digital Signatures and Public-Key Cryptosystems'},
  pk_ecc: {year: 1985, who: 'N. Koblitz & V. Miller', work: 'Elliptic Curve Cryptosystems（各自独立提出）'},
  pk_p_hastad: {year: 1985, who: 'J. Håstad', work: 'On Using RSA with Low Exponent in a Public Key Network'},
  pk_tls: {year: 2018, who: 'IETF · E. Rescorla', work: 'RFC 8446: TLS 1.3'},

  sig_euf: {year: 1988, who: 'S. Goldwasser, S. Micali & R. Rivest', work: 'A Digital Signature Scheme Secure Against Adaptive Chosen-Message Attacks'},
  sig_lamport: {year: 1979, who: 'L. Lamport', work: 'Constructing Digital Signatures from a One Way Function'},
  sig_p_lamport2: {year: 1979, who: 'L. Lamport', work: '一次签名：每把密钥只能签一条消息'},
  sig_schnorr: {year: 1989, who: 'C. P. Schnorr · A. Fiat & A. Shamir 1986', work: 'Efficient Signature Generation by Smart Cards'},
  sig_p_nonce: {year: 2010, who: 'fail0verflow', work: '27C3：PS3 的 ECDSA 复用随机数，私钥被算出'},
  sig_merkle: {year: 1979, who: 'R. Merkle', work: 'Secrecy, Authentication and Public Key Systems → SLH-DSA（FIPS 205, 2024）'},
  sig_bls: {year: 2001, who: 'D. Boneh, B. Lynn & H. Shacham', work: 'Short Signatures from the Weil Pairing'},

  zk_cave: {year: 1989, who: 'J.-J. Quisquater 等', work: 'How to Explain Zero-Knowledge Protocols to Your Children'},
  zk_gi: {year: 1986, who: 'O. Goldreich, S. Micali & A. Wigderson', work: 'Proofs that Yield Nothing but Their Validity'},
  zk_sigma: {year: 1989, who: 'C. P. Schnorr · R. Cramer 1996', work: 'Efficient Identification and Signatures for Smart Cards'},
  zk_p_fs: {year: 2012, who: 'D. Bernhard, O. Pereira & B. Warinschi', work: 'How Not to Prove Yourself: Pitfalls of the Fiat–Shamir Heuristic'},
  zk_sumcheck: {year: 1990, who: 'C. Lund, L. Fortnow, H. Karloff & N. Nisan', work: 'Algebraic Methods for Interactive Proof Systems'},
  zk_snark: {year: 2016, who: 'J. Groth', work: 'On the Size of Pairing-based Non-interactive Arguments'},

  fr_dilithium: {year: 2009, who: 'V. Lyubashevsky', work: 'Fiat–Shamir with Aborts → ML-DSA（FIPS 204, 2024）'},
  fr_mpc: {year: 1986, who: 'A. C. Yao · Goldreich–Micali–Wigderson 1987 · Ben-Or–Goldwasser–Wigderson 1988', work: 'How to Generate and Exchange Secrets'},
  fr_pir: {year: 1995, who: 'B. Chor, O. Goldreich, E. Kushilevitz & M. Sudan', work: 'Private Information Retrieval'},
  fr_dp: {year: 2006, who: 'C. Dwork, F. McSherry, K. Nissim & A. Smith', work: 'Calibrating Noise to Sensitivity in Private Data Analysis'},
  fr_masking: {year: 2001, who: 'L. Goubin · P. Kocher 1999 · Ishai–Sahai–Wagner 2003', work: 'A Sound Method for Switching between Boolean and Arithmetic Masking'},
  fr_p_shamir: {year: 1979, who: 'A. Shamir', work: 'How to Share a Secret'},
  fr_lwe: {year: 2005, who: 'O. Regev', work: 'On Lattices, Learning with Errors, Random Linear Codes, and Cryptography'},
  fr_fhe: {year: 2009, who: 'C. Gentry', work: 'Fully Homomorphic Encryption Using Ideal Lattices'},
};

/** per-act milestone timeline, keyed by the act number shown on the title card */
export const MILESTONES: Record<string, [number, string][]> = {
  '01': [
    [1883, 'Kerckhoffs 原则'],
    [1917, 'Vernam 一次一密'],
    [1949, 'Shannon 保密理论'],
    [1977, 'DES'],
    [1990, '差分分析'],
    [1993, '线性分析'],
    [2001, 'AES'],
    [2002, '填充谕言攻击'],
  ],
  '02': [
    [1976, 'Diffie–Hellman'],
    [1977, 'RSA'],
    [1985, 'ElGamal · ECC'],
    [1994, 'Shor 量子算法'],
    [2018, 'TLS 1.3'],
  ],
  '03': [
    [1979, 'Lamport · Merkle'],
    [1986, 'Fiat–Shamir'],
    [1988, 'GMR 安全定义'],
    [1989, 'Schnorr'],
    [2001, 'BLS'],
    [2024, 'ML-DSA · SLH-DSA'],
  ],
  '04': [
    [1985, 'GMR 零知识'],
    [1986, 'GMW 图同构 · Fiat–Shamir'],
    [1989, 'Schnorr'],
    [1990, 'Sumcheck'],
    [2012, 'Fiat–Shamir 的陷阱'],
    [2016, 'Groth16'],
  ],
  '05': [
    [1965, 'Warner 随机化回答'],
    [1979, 'Shamir 秘密共享'],
    [1986, 'Yao 安全多方计算'],
    [1994, 'Shor 量子算法'],
    [1995, 'PIR'],
    [1999, '差分功耗分析'],
    [2001, 'Goubin 掩码转换'],
    [2005, 'Regev LWE'],
    [2009, 'Gentry FHE'],
    [2024, 'ML-KEM · ML-DSA'],
  ],
};

/** case studies in film order — Problem pages are numbered from this list (CASE 01, 02, …) */
export const CASE_ORDER = [
  'sym_p_twotime',
  'sym_p_algebraic',
  'sym_p_birthday',
  'sym_p_padding',
  'pk_p_rsa',
  'pk_p_hastad',
  'sig_p_lamport2',
  'sig_p_nonce',
  'zk_p_fs',
  'fr_p_shamir',
];
