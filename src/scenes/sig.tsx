import React from 'react';
import {ActTitle} from '../components/ActTitle';
import {COL} from '../theme';

export {SigEuf, SigEufCues} from './sig_euf';
export {SigLamport, SigLamportCues} from './sig_lamport';
export {SigLamport2, SigLamport2Cues, SigNonce, SigNonceCues} from './sig_cases';
export {SigSchnorr, SigSchnorrCues} from './sig_schnorr';
export {SigMerkle, SigMerkleCues} from './sig_merkle';
export {SigBls, SigBlsCues} from './sig_bls';

export const SigTitle: React.FC = () => (
  <ActTitle
    num="03"
    zh="数字签名"
    en="DIGITAL SIGNATURES"
    color={COL.sig}
    topics={['EUF-CMA', '单向函数', 'Lamport 一次签名', 'Schnorr', 'Fiat–Shamir', 'Merkle 树', 'BLS 与配对', '门限签名']}
    quote="即使见过任意多个签名，也造不出一个新的"
    by="Goldwasser · Micali · Rivest, 1988"
    year={1979}
  />
);
