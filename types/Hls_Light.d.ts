// hls.js ships the light build without its own typings: it is the same API as the full one.
declare module 'hls.js/dist/hls.light.mjs' {
  import Hls from 'hls.js';

  export default Hls;
}
