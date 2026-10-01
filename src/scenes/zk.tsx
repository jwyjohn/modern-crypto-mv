import React from 'react';
import {ActTitle} from '../components/ActTitle';
import {COL} from '../theme';

export {ZkCave, ZkCaveCues} from './zk_cave';
export {ZkSigma, ZkSigmaCues} from './zk_sigma';
export {ZkSnark, ZkSnarkCues} from './zk_snark';
export {ZkShamir, ZkShamirCues} from './zk_shamir';
export {ZkLwe, ZkLweCues} from './zk_lwe';
export {ZkFhe, ZkFheCues} from './zk_fhe';

export const ZkTitle: React.FC = () => (
  <ActTitle
    num="04"
    zh="零知识证明"
    en="ZERO-KNOWLEDGE PROOFS"
    color={COL.zk}
    topics={['交互证明', '图同构', 'Σ 协议', 'Fiat–Shamir 的陷阱', 'Sumcheck', 'SNARK']}
    quote="证明你知道，却不泄露你知道什么"
    by="Goldwasser · Micali · Rackoff, 1985"
    year={1985}
  />
);
