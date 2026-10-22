import { Composition } from 'remotion';
import { Episode } from './Episode';
import { initialScript } from '../script';
export const Root = () => <Composition id="FrutinovelasEpisode" component={Episode} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{script:initialScript}}/>;
