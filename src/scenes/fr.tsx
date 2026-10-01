import React from 'react';
import {ActTitle} from '../components/ActTitle';
import {COL} from '../theme';

/* Chapter V — 前沿：后量子与隐私计算 */
export const FrTitle: React.FC = () => (
  <ActTitle
    num="05"
    zh="后量子与隐私计算"
    en="POST-QUANTUM & PRIVACY"
    color={COL.fr}
    topics={['LWE 与 Kyber', '格签名 ML-DSA', '侧信道与掩码', '秘密共享', '安全多方计算', '隐私信息检索', '差分隐私', '全同态加密']}
    quote="自然不是经典的。想模拟自然，最好用量子力学的方式"
    by="Richard Feynman, 1981"
    year={1994}
  />
);

export {FrDilithium, FrDilithiumCues} from './fr_dilithium';
export {FrPir, FrPirCues} from './fr_pir';
export {FrDp, FrDpCues} from './fr_dp';
export {FrMasking, FrMaskingCues} from './fr_masking';
export {FrMpc, FrMpcCues} from './fr_mpc';
