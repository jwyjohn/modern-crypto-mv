import React from 'react';
import {ActTitle} from '../components/ActTitle';
import {COL} from '../theme';

export {PkDh, PkDhCues} from './pk_dh';
export {PkGroup, PkGroupCues} from './pk_group';
export {PkRsa, PkRsaCues} from './pk_rsa';
export {PkEcc, PkEccCues} from './pk_ecc';
export {PkHastad, PkHastadCues} from './pk_hastad';
export {PkTls, PkTlsCues} from './pk_tls';

export const PkTitle: React.FC = () => (
  <ActTitle
    num="02"
    zh="公钥密码"
    en="PUBLIC-KEY CRYPTO"
    color={COL.pk}
    topics={['模运算与有限域', '循环群', '离散对数', 'Diffie–Hellman', 'RSA 陷门', '椭圆曲线', 'TLS 1.3']}
    quote="我们正站在密码学革命的边缘"
    by="Diffie & Hellman, 1976"
    year={1976}
  />
);

