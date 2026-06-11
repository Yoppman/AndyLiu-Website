/**
 * Cheap synchronous probe for WebGL support, used to decide whether a 3D
 * experience should mount at all (e.g. the camera intro skips itself on
 * devices that would only ever see a black rectangle).
 */
export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
