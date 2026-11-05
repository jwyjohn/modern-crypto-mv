import React from 'react';
import {Composition} from 'remotion';
import {ensureFonts} from './fonts';
import {Main} from './Main';
import {TOTAL} from './timeline';
import {Cover} from './cover/Cover';

ensureFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="MVInference" component={Main} durationInFrames={TOTAL} fps={60} width={1920} height={1080} defaultProps={{cast: 'ba' as const}} />
    <Composition id="MVInferenceClassic" component={Main} durationInFrames={TOTAL} fps={60} width={1920} height={1080} defaultProps={{cast: 'classic' as const}} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={60} width={1600} height={1200} />
    <Composition id="MVInferencePreview" component={Main} durationInFrames={TOTAL} fps={60} width={1920} height={1080} defaultProps={{mute: true, cast: 'ba' as const}} />
  </>
);
