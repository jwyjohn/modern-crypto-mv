import React from 'react';
import {Composition} from 'remotion';
import {ensureFonts} from './fonts';
import {Main} from './Main';
import {TIMELINES} from './timeline';

ensureFonts();

const FULL = TIMELINES.full.TOTAL;
const SHORT = TIMELINES.short.TOTAL;

export const Root: React.FC = () => (
  <>
    <Composition id="MVCrypto" component={Main} durationInFrames={FULL} fps={60} width={1920} height={1080} defaultProps={{variant: 'full' as const}} />
    <Composition id="MVCryptoShort" component={Main} durationInFrames={SHORT} fps={60} width={1920} height={1080} defaultProps={{variant: 'short' as const}} />
    <Composition id="MVCryptoClassic" component={Main} durationInFrames={FULL} fps={60} width={1920} height={1080} defaultProps={{variant: 'full' as const, cast: 'classic' as const}} />
    <Composition id="MVCryptoShortClassic" component={Main} durationInFrames={SHORT} fps={60} width={1920} height={1080} defaultProps={{variant: 'short' as const, cast: 'classic' as const}} />
    <Composition id="MVCryptoPreview" component={Main} durationInFrames={FULL} fps={60} width={1920} height={1080} defaultProps={{mute: true, variant: 'full' as const}} />
    <Composition id="MVCryptoShortPreview" component={Main} durationInFrames={SHORT} fps={60} width={1920} height={1080} defaultProps={{mute: true, variant: 'short' as const}} />
  </>
);
