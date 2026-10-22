import { Composition } from 'remotion';
import { Episode } from './Episode';
import { FPS, initialScript, scriptDurationInFrames, type EpisodeScript } from '../script';
export const Root = () => <Composition id="FrutinovelasEpisode" component={Episode} durationInFrames={scriptDurationInFrames(initialScript)} fps={FPS} width={1080} height={1920} defaultProps={{script:initialScript}} calculateMetadata={({props}) => ({ durationInFrames: scriptDurationInFrames((props as {script: EpisodeScript}).script) })}/>;
