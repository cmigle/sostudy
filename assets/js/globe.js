import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

const canvas = document.getElementById("globe");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  camera.position.z = 7;

  // Fibonacci sphere of dots
  const N = innerWidth < 760 ? 1400 : 2600;
  const pos = new Float32Array(N * 3), rnd = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = golden * i;
    pos.set([Math.cos(t) * r, y, Math.sin(t) * r], i * 3);
    rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(9, 9, 9) },
    uPx: { value: Math.min(devicePixelRatio, 2) },
    uRed: { value: new THREE.Color("#ff4a4b") },
    uInk: { value: new THREE.Color("#1f1f1f") },
    uGreen: { value: new THREE.Color("#8da978") }
  };

  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime, uPx; uniform vec3 uMouse;
      attribute float aRnd;
      varying float vA; varying float vR; varying float vHot;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 4. + uTime) * sin(p.y * 4. + uTime * 1.3) * sin(p.z * 4. + uTime * .7);
        p += normalize(position) * w * .09;
        vec4 world = modelMatrix * vec4(p, 1.);
        float d = distance(world.xyz, uMouse);
        float hot = smoothstep(1.1, 0., d);
        world.xyz += normalize(world.xyz) * hot * .45;
        vec4 mv = viewMatrix * world;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.4 + aRnd * 2.2 + hot * 4.) * uPx * (6. / -mv.z);
        vA = smoothstep(-1.4, .9, world.z);
        vR = aRnd; vHot = hot;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRed, uInk, uGreen;
      varying float vA; varying float vR; varying float vHot;
      void main() {
        if (length(gl_PointCoord - .5) > .5) discard;
        vec3 c = vR > .93 ? uRed : vR > .86 ? uGreen : uInk;
        c = mix(c, uRed, vHot);
        gl_FragColor = vec4(c, (.18 + .72 * vA) * (vR > .86 ? 1. : .7));
      }`
  });

  const globe = new THREE.Points(geo, mat);
  globe.scale.setScalar(2.2);
  scene.add(globe);

  // Orbit ring of dots
  const ringN = 220, ringPos = new Float32Array(ringN * 3), ringRnd = new Float32Array(ringN).fill(.9);
  for (let i = 0; i < ringN; i++) { const a = i / ringN * Math.PI * 2; ringPos.set([Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55], i * 3); }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
  ringGeo.setAttribute("aRnd", new THREE.BufferAttribute(ringRnd, 1));
  const ring = new THREE.Points(ringGeo, mat);
  ring.rotation.x = 1.2; ring.rotation.z = .3;
  globe.add(ring);

  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // place globe behind the car (right column on desktop, top on mobile)
    const mobile = w < 900;
    globe.position.set(mobile ? 0 : 1.9 * camera.aspect / 1.6, mobile ? 1.1 : .1, 0);
    globe.scale.setScalar(mobile ? 1.5 : 2.2);
  }
  size();
  addEventListener("resize", size);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.2), hit = new THREE.Vector3();
  let tx = 0, ty = 0;
  addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) uniforms.uMouse.value.copy(hit);
    tx = ndc.x; ty = ndc.y;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = reduce ? 0 : t * .8;
    const sp = Math.min(scrollY / innerHeight, 1);
    globe.rotation.y += reduce ? 0 : .0025 + sp * .01;
    globe.rotation.x += ((ty * .25) - globe.rotation.x) * .05;
    globe.rotation.z += ((-tx * .15) - globe.rotation.z) * .05;
    camera.position.z = 7 - sp * 2.2;
    renderer.render(scene, camera);
  });
}
