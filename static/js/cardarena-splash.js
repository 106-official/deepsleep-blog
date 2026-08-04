// cardarena-splash.js — CardArena 开场闪屏（金质卡牌扇阵，复用 self-hosted /js/three.module.min.js）
// 设计母题：苏丹宫廷黑金 · 多张华丽卡牌在 3D 空间缓慢旋转扇开 + 金尘上浮 + 鼠标视差
// 交互：跳过 ✕ / 进入 → / 不再自动播放（localStorage）；4.5s 自动淡出；无 WebGL 降级纯 CSS 金徽
import * as THREE from 'three';

(function () {
  'use strict';

  const SPLASH_KEY = 'cardarena_splash_never';
  const splash = document.getElementById('ca-splash');
  const canvas = document.getElementById('ca-splash-canvas');
  const fallback = document.getElementById('ca-splash-fallback');
  if (!splash) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const never = (function () {
    try { return localStorage.getItem(SPLASH_KEY) === '1'; } catch (e) { return false; }
  })();
  const willShow = !never;
  window.__CA_SPLASH_WILL_SHOW = willShow;

  let dismissed = false;
  let renderer, scene, camera, fan, particles, keyLight, cardMats = [];
  let elapsed = 0, lastT = 0;
  let mouse = { x: 0, y: 0 }, parallax = { x: 0, y: 0 };
  let webglOK = true, started = false;
  const AUTO = reduceMotion ? 1800 : 4500;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('gone');
    window.dispatchEvent(new Event('cardarena:splash-done'));
    setTimeout(function () { if (splash) splash.style.display = 'none'; }, 950);
    if (renderer && renderer.setAnimationLoop) renderer.setAnimationLoop(null);
  }

  function makeCardTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 358;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 358);
    g.addColorStop(0, '#240a0f'); g.addColorStop(0.5, '#52101b'); g.addColorStop(1, '#190507');
    x.fillStyle = g; x.fillRect(0, 0, 256, 358);
    x.strokeStyle = '#d4af37'; x.lineWidth = 6; x.strokeRect(9, 9, 238, 340);
    x.strokeStyle = 'rgba(212,175,55,0.45)'; x.lineWidth = 1; x.strokeRect(17, 17, 222, 324);
    // 阿拉伯八角星（双方形叠加 45° + 中心圆 + 四向小圆）
    x.save(); x.translate(128, 150);
    x.strokeStyle = '#d4af37'; x.lineWidth = 3;
    for (let r = 0; r < 2; r++) { x.save(); x.rotate(r * Math.PI / 4); x.strokeRect(-62, -62, 124, 124); x.restore(); }
    x.fillStyle = '#f3dfa0';
    x.beginPath(); x.arc(0, 0, 11, 0, Math.PI * 2); x.fill();
    [[0, -86], [0, 86], [-86, 0], [86, 0]].forEach(function (p) {
      x.beginPath(); x.arc(p[0], p[1], 5, 0, Math.PI * 2); x.fill();
    });
    x.restore();
    // 品级缎带
    x.fillStyle = '#e8c64a'; x.font = 'bold 24px Georgia, serif'; x.textAlign = 'center';
    x.fillText('GOLD', 128, 314);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  function makeCard() {
    const tex = makeCardTexture();
    const side = new THREE.MeshStandardMaterial({ color: 0x8a6a2f, metalness: 0.6, roughness: 0.4 });
    const front = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3, metalness: 0.25, roughness: 0.6
    });
    const back = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.35 });
    cardMats.push(front);
    const mats = [side, side, side, side, front, back]; // px,nx,py,ny,pz,nz
    const geo = new THREE.BoxGeometry(1.0, 1.4, 0.04);
    return new THREE.Mesh(geo, mats);
  }

  function buildFan() {
    const N = 9, spread = 0.17;
    fan = new THREE.Group();
    for (let i = 0; i < N; i++) {
      const a = (i - (N - 1) / 2) * spread;
      const pivot = new THREE.Group();
      const card = makeCard();
      card.position.y = 0.72;
      pivot.add(card);
      pivot.rotation.z = a;
      pivot.userData = { base: a, phase: i * 0.6 };
      fan.add(pivot);
    }
    fan.position.set(0, -0.15, 0);
    scene.add(fan);
  }

  function buildParticles() {
    const N = 140;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 1.4 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = Math.sin(a) * r - 1;
      vel[i] = 0.15 + Math.random() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf3d98c, size: 0.07, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    particles = new THREE.Points(geo, mat);
    particles.userData.vel = vel;
    scene.add(particles);
  }

  function initThree() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { webglOK = false; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.2, 5.4);
    scene.add(new THREE.AmbientLight(0x3a2410, 0.7));
    keyLight = new THREE.PointLight(0xf3d98c, 0.0, 30, 2.0);
    keyLight.position.set(0, 0.6, 2.2);
    scene.add(keyLight);
    buildFan();
    buildParticles();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove);
    renderer.setAnimationLoop(animate);
  }

  function onResize() {
    if (!webglOK) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function onPointerMove(e) {
    const t = (e.touches && e.touches[0]) || e;
    mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (t.clientY / window.innerHeight) * 2 - 1;
  }
  function animate(now) {
    if (document.hidden) return; // 标签页隐藏即暂停
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    elapsed += dt;
    const t = elapsed;
    const lit = Math.min(t / 1.4, 1);
    const ease = lit * lit * (3 - 2 * lit);
    if (keyLight) keyLight.intensity = 2.4 * ease;
    for (let i = 0; i < cardMats.length; i++) cardMats[i].emissiveIntensity = 0.22 + 0.42 * ease;
    if (fan) {
      fan.rotation.y = Math.sin(t * 0.3) * 0.28;
      fan.rotation.x = -0.08 + Math.sin(t * 0.4) * 0.05;
      fan.children.forEach(function (p) {
        const ph = p.userData.phase;
        p.rotation.z = p.userData.base + Math.sin(t * 0.5 + ph) * 0.02;
        const card = p.children[0];
        if (card) card.position.y = 0.72 + Math.sin(t * 0.8 + ph) * 0.03;
      });
    }
    if (particles) {
      const arr = particles.geometry.attributes.position.array;
      const vel = particles.userData.vel;
      for (let i = 0; i < vel.length; i++) {
        arr[i * 3 + 1] += vel[i] * dt;
        if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = -5;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.material.opacity = 0.8 * ease;
    }
    parallax.x += (mouse.x - parallax.x) * 0.05;
    parallax.y += (mouse.y - parallax.y) * 0.05;
    camera.position.x = parallax.x * 0.7;
    camera.position.y = 0.2 - parallax.y * 0.5;
    camera.lookAt(0, 0, 0);
    if (keyLight) keyLight.position.x = parallax.x * 1.4;
    renderer.render(scene, camera);
  }

  function start() {
    if (started) return;
    started = true;
    window.__CA_SPLASH_STARTED = true;
    try {
      if (!reduceMotion && webglOK) {
        initThree();
        if (!webglOK && fallback) fallback.style.display = 'flex';
      } else if (fallback) {
        fallback.style.display = 'flex';
      }
    } catch (e) {
      // 任何 3D 异常都降级为纯 CSS 金徽，并继续走淡出流程
      webglOK = false;
      if (fallback) fallback.style.display = 'flex';
    }
    // 双 rAF 后再加 .show，确保首帧已渲染、淡入顺滑
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { splash.classList.add('show'); });
    });
    if (willShow) setTimeout(dismiss, AUTO);
  }

  const enterBtn = document.getElementById('ca-splash-enter');
  const skipBtn = document.getElementById('ca-splash-skip');
  const neverBox = document.getElementById('ca-splash-never');
  if (enterBtn) enterBtn.addEventListener('click', dismiss);
  if (skipBtn) skipBtn.addEventListener('click', dismiss);
  if (neverBox) neverBox.addEventListener('change', function (e) {
    try { localStorage.setItem(SPLASH_KEY, e.target.checked ? '1' : '0'); } catch (err) {}
    if (e.target.checked) dismiss();
  });

  if (willShow) {
    start();
  } else {
    splash.style.display = 'none';
  }
})();
