import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Forces this canvas's WebGL context to be released the instant the scene
 * unmounts, rather than waiting for the browser to garbage-collect it.
 *
 * Pages mount and unmount their R3F canvases as you scroll and as you navigate
 * between routes, and StrictMode doubles every mount in dev. Browsers are slow to
 * reclaim a WebGL context when its canvas is torn down, so these remounts pile up
 * orphaned contexts until the browser hits its per-page limit and starts killing
 * the LIVE one — surfacing as "THREE.WebGLRenderer: Context Lost." with no
 * matching "Context Restored." The visible scene then freezes on its last frame
 * while everything else stays black, and the next canvas that tries to spin up
 * gets a null context (which, uncaught, blanks the whole route to white).
 *
 * forceContextLoss() invokes WEBGL_lose_context to free the GPU resources
 * immediately, keeping the live context count at ~1 per scene so the canvas you
 * are actually looking at never gets starved.
 */
const ReleaseContextOnUnmount: React.FC = () => {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    return () => {
      try {
        gl.forceContextLoss();
      } catch {
        /* renderer may already be torn down — nothing to release */
      }
    };
  }, [gl]);
  return null;
};

export default ReleaseContextOnUnmount;
