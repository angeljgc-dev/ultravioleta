import{a as e,s as t,u as n}from"./index-CrjdbFEu.js";var r=n(t(),1),i=e(),a=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,o=`
precision mediump float;
uniform float uTiempo;
uniform vec2 uResolucion;
varying vec2 vUv;

/* paleta ULTRAVIOLETA (uniforms desde tokens, ver abajo) */
uniform vec3 uFondo;
uniform vec3 uVioleta;
uniform vec3 uLavanda;
uniform vec3 uMagenta;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * ruido(p);
    p = r * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  uv.x *= uResolucion.x / max(uResolucion.y, 1.0);

  float t = uTiempo * 0.05;

  /* domain warping: el ruido deforma al ruido -> pliegues de seda */
  vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t * 0.7 + 5.2));
  vec2 w = vec2(
    fbm(uv * 1.8 + q * 1.6 + vec2(1.7, 9.2) + t * 0.6),
    fbm(uv * 1.8 + q * 1.6 + vec2(8.3, 2.8) - t * 0.4)
  );
  float pliegue = fbm(uv * 2.2 + w * 1.8);

  vec3 col = uFondo;
  col = mix(col, uVioleta * 0.55, smoothstep(0.25, 0.75, pliegue));
  col = mix(col, uLavanda * 0.50, smoothstep(0.55, 0.95, pliegue) * 0.6);
  col = mix(col, uMagenta * 0.45, smoothstep(0.80, 1.00, pliegue + q.x * 0.2) * 0.5);

  /* viñeta hacia el fondo: el centro respira, los bordes se apagan */
  float r = length((vUv - 0.5) * vec2(1.15, 1.0));
  col = mix(col, uFondo, smoothstep(0.45, 0.95, r) * 0.85);

  /* grano fino: rompe el banding de los gradientes oscuros */
  col += (hash21(vUv * uResolucion + uTiempo) - 0.5) * 0.02;

  /* cuantización con patrón Bayer 4x4: fósforo ditherizado de CRT */
  vec2 px = floor(vUv * uResolucion * 0.5);
  float bx = mod(px.x, 4.0), by = mod(px.y, 4.0);
  float bayer = mod(bx * 2.0 + by * 3.0 + bx * by, 16.0) / 16.0;
  float niveles = 22.0;
  col = floor(col * niveles + bayer) / niveles;

  gl_FragColor = vec4(col, 1.0);
}`;function s(e,t){if(typeof window>`u`)return t;let n=getComputedStyle(document.documentElement).getPropertyValue(e).trim().match(/^#([0-9a-f]{6})$/i);if(!n)return t;let r=parseInt(n[1],16);return[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}function c(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(console.error(e.getShaderInfoLog(r)),e.deleteShader(r),null)}function l(){let e=(0,r.useRef)(null),[t,n]=(0,r.useState)(!0);return(0,r.useEffect)(()=>{let t=e.current;if(!t)return;let r=t.getContext(`webgl`,{antialias:!1,alpha:!1})||t.getContext(`experimental-webgl`);if(!r){n(!1);return}let i=c(r,r.VERTEX_SHADER,a),l=c(r,r.FRAGMENT_SHADER,o);if(!i||!l){n(!1);return}let u=r.createProgram();if(r.attachShader(u,i),r.attachShader(u,l),r.linkProgram(u),!r.getProgramParameter(u,r.LINK_STATUS)){n(!1);return}r.useProgram(u);let d=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,d),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);let f=r.getAttribLocation(u,`aPos`);r.enableVertexAttribArray(f),r.vertexAttribPointer(f,2,r.FLOAT,!1,0,0);let p=r.getUniformLocation(u,`uTiempo`),m=r.getUniformLocation(u,`uResolucion`);r.uniform3fv(r.getUniformLocation(u,`uFondo`),s(`--color-fondo`,[.024,0,.063])),r.uniform3fv(r.getUniformLocation(u,`uVioleta`),s(`--color-violeta`,[.486,.227,.929])),r.uniform3fv(r.getUniformLocation(u,`uLavanda`),s(`--color-lavanda`,[.694,.62,.937])),r.uniform3fv(r.getUniformLocation(u,`uMagenta`),s(`--color-magenta`,[1,.18,.651]));let h=()=>{let e=Math.max(1,t.clientWidth),n=Math.max(1,t.clientHeight);(t.width!==e||t.height!==n)&&(t.width=e,t.height=n),r.viewport(0,0,t.width,t.height),r.uniform2f(m,t.width,t.height)},g=new ResizeObserver(h);g.observe(t),h();let _=matchMedia(`(prefers-reduced-motion: reduce)`).matches,v=!1,y=0,b=performance.now(),x=e=>{r.uniform1f(p,(e-b)/1e3),r.drawArrays(r.TRIANGLES,0,3)};if(_)x(b+7300);else{let e=t=>{x(t),y=requestAnimationFrame(e)},n=()=>{v&&!document.hidden?y||=requestAnimationFrame(e):y&&=(cancelAnimationFrame(y),0)},r=new IntersectionObserver(([e])=>{v=e.isIntersecting,n()},{rootMargin:`10% 0px`});return r.observe(t),document.addEventListener(`visibilitychange`,n),()=>{r.disconnect(),document.removeEventListener(`visibilitychange`,n),y&&cancelAnimationFrame(y),g.disconnect()}}return()=>{g.disconnect()}},[]),t?(0,i.jsx)(`canvas`,{ref:e,"aria-hidden":`true`,className:`absolute inset-0 h-full w-full`}):null}export{l as default};