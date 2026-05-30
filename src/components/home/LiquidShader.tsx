import React, { useEffect, useRef, useState } from 'react';
import { cldFull } from '../gallery/shared/cloudinaryUtils';
import { useScrollProgress } from './useScrollProgress';

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec2 uRes;
uniform vec2 uImgA;
uniform vec2 uImgB;
uniform vec2 uMouse;
uniform float uTime;
uniform float uProgress;
uniform float uAmp;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec2 coverUv(vec2 uv, vec2 res, vec2 img){
  float ca = res.x / res.y;
  float ia = img.x / img.y;
  vec2 s = (ca < ia) ? vec2(ca / ia, 1.0) : vec2(1.0, ia / ca);
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = vUv;
  float t = uTime * 0.05;
  // flowing domain warp
  vec2 q = vec2(noise(uv * 3.0 + t), noise(uv * 3.0 - t + 7.3));
  vec2 disp = (q - 0.5) * uAmp;
  // cursor ripple
  float d = distance(vUv, uMouse);
  float ripple = smoothstep(0.4, 0.0, d) * 0.05;
  disp += normalize(vUv - uMouse + 0.0001) * ripple * sin(d * 28.0 - uTime * 2.0);

  float m = length(disp) * 1.4 + ripple * 3.5;
  vec2 ca = coverUv(uv + disp, uRes, uImgA);
  vec2 cb = coverUv(uv + disp, uRes, uImgB);

  vec3 colA = vec3(
    texture2D(uTexA, ca + vec2(m * 0.012, 0.0)).r,
    texture2D(uTexA, ca).g,
    texture2D(uTexA, ca - vec2(m * 0.012, 0.0)).b
  );
  vec3 colB = vec3(
    texture2D(uTexB, cb + vec2(m * 0.012, 0.0)).r,
    texture2D(uTexB, cb).g,
    texture2D(uTexB, cb - vec2(m * 0.012, 0.0)).b
  );
  vec3 col = mix(colA, colB, smoothstep(0.0, 1.0, uProgress));
  // subtle vignette
  float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
  col *= mix(0.7, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

interface Props {
  images: string[];
}

/**
 * Act III — a liquid WebGL surface. Two photographs flow under animated noise,
 * warp toward the cursor with a soft RGB split, and cross-dissolve as you
 * scroll. Draws a static frame immediately, so the image is always visible;
 * animation runs when allowed. Falls back to a plain image without WebGL.
 */
const LiquidShader: React.FC<Props> = ({ images }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const progress = useScrollProgress(sectionRef);
  const imgA = images[0];
  const imgB = images[1] ?? images[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      setFailed(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, 'uRes'),
      imgA: gl.getUniformLocation(prog, 'uImgA'),
      imgB: gl.getUniformLocation(prog, 'uImgB'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      time: gl.getUniformLocation(prog, 'uTime'),
      progress: gl.getUniformLocation(prog, 'uProgress'),
      amp: gl.getUniformLocation(prog, 'uAmp'),
      texA: gl.getUniformLocation(prog, 'uTexA'),
      texB: gl.getUniformLocation(prog, 'uTexB'),
    };

    const makeTex = (unit: number) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // 1x1 placeholder until the photo loads
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 22, 255]));
      return tex;
    };
    const texA = makeTex(0);
    const texB = makeTex(1);
    const imgSize = { a: [1, 1], b: [1, 1] };

    const loadInto = (url: string, tex: WebGLTexture | null, unit: number, which: 'a' | 'b') => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        imgSize[which] = [img.naturalWidth, img.naturalHeight];
        draw(lastTime);
      };
      img.src = cldFull(url, 1600);
    };

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1.0 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener('mousemove', onMove);

    let lastTime = 0;
    const draw = (time: number) => {
      lastTime = time;
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      gl.useProgram(prog);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform2f(U.imgA, imgSize.a[0], imgSize.a[1]);
      gl.uniform2f(U.imgB, imgSize.b[0], imgSize.b[1]);
      gl.uniform2f(U.mouse, mouse.x, mouse.y);
      gl.uniform1f(U.time, time * 0.001);
      gl.uniform1f(U.progress, progress.get());
      gl.uniform1f(U.amp, 0.03);
      gl.uniform1i(U.texA, 0);
      gl.uniform1i(U.texB, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    loadInto(imgA, texA, 0, 'a');
    loadInto(imgB, texB, 1, 'b');
    resize();
    draw(0); // static first frame even if rAF never runs

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let alive = true;
    const loop = (t: number) => {
      if (!alive) return;
      if (!document.hidden) draw(t);
      raf = requestAnimationFrame(loop);
    };
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    const onResize = () => { resize(); draw(lastTime); };
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, [imgA, imgB, progress]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '180vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        {failed ? (
          <img src={cldFull(imgA, 1800)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        )}
        {/* closing invitation into the work */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-[14vh] pointer-events-none">
          <a
            href="/photography"
            className="pointer-events-auto group inline-flex flex-col items-center gap-3 text-white mix-blend-difference"
          >
            <span className="font-cormorant tracking-[0.45em] text-[0.7rem] md:text-sm uppercase pl-[0.45em] opacity-80">
              Enter the work
            </span>
            <span className="font-cormorant italic text-3xl md:text-5xl transition-transform duration-500 group-hover:translate-y-1">
              View the Galleries
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default LiquidShader;
