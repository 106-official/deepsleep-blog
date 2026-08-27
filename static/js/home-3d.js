// ============================================
// DeepSleep Blog - 首页 3D 背景场景
// 高级灰 + 优雅金配色，与博客主题保持一致
// 元素：岩石 / 水面反射 / 金色发光球(假 Bloom) / 玻璃环 / 金色粒子
// 相机：慢速绕行 + 鼠标视差
// 依赖：/js/three.module.min.js（importmap: three）
// ============================================

import * as THREE from 'three';

const canvas = document.getElementById('bg-scene');
if (!canvas) {
  // 页面未包含画布（例如构建环境预览）直接退出
} else {
  init();
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove(); // WebGL 不可用：移除画布，退化为纯毛玻璃（不崩内容）
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf2f2f0, 22, 55);

  const camera = new THREE.PerspectiveCamera(46, canvas.clientWidth / canvas.clientHeight, 0.1, 120);

  // ---------- 配色表（亮 / 暗主题） ----------
  const PALETTE = {
    light: {
      clear: 0xf0efec,
      rock: 0xcfcdc7, rockDark: 0xb9b6ae, rockDeep: 0xa3a098,
      water: 0x9fb6b8, waterGloss: 0xb8c8c9,
      glass: 0xffffff, gold: 0xD4AF37, goldBright: 0xf0d785,
    },
    dark: {
      clear: 0x141416,
      rock: 0x2e2e33, rockDark: 0x222227, rockDeep: 0x191a1e,
      water: 0x24384a, waterGloss: 0x33506b,
      glass: 0xffffff, gold: 0xD4AF37, goldBright: 0xf5e6a8,
    },
  };
  const themeOf = () =>
    document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  const cur = () => PALETTE[themeOf()];

  // ---------- 相机路径（慢速 Lissajous 绕行） ----------
  const camBase = { r: 11.5, y: 3.6 };
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

  // ---------- 灯光 ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff3d6, 1.1);
  key.position.set(6, 9, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fd0ff, 0.4);
  rim.position.set(-6, 2, -6);
  scene.add(rim);

  const group = new THREE.Group(); // 场景整体容器，随视差轻微倾斜
  scene.add(group);

  // ---------- 金色发光球 + 假 Bloom（多层叠加精灵） ----------
  const goldRadius = 1.5;
  const orbPos = new THREE.Vector3(3.2, 2.6, -3.5);
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(goldRadius, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xD4AF37, emissiveIntensity: 1.9, roughness: 0.18, metalness: 0.5 })
  );
  orb.position.copy(orbPos);
  group.add(orb);

  function makeGlow(size, opacity) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,220,140,1)');
    grd.addColorStop(0.25, 'rgba(212,175,55,0.55)');
    grd.addColorStop(1, 'rgba(212,175,55,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(size, size, 1);
    sp.position.copy(orbPos);
    return sp;
  }
  group.add(makeGlow(16, 0.5));   // 外层大光晕
  group.add(makeGlow(7.5, 0.9));  // 内层亮核

  // ---------- 玻璃环（MeshPhysicalMaterial 透明折射感） ----------
  const rings = [];
  const ringSpecs = [
    { radius: 2.6, tube: 0.16, pos: [3.2, 2.6, -3.5], rotY: 0.3, y: 0.2 },
    { radius: 3.6, tube: 0.1, pos: [3.2, 2.6, -3.5], rotY: -0.5, y: -0.5 },
    { radius: 2.0, tube: 0.07, pos: [3.2, 2.6, -3.5], rotY: 1.2, y: -1.0 },
  ];
  ringSpecs.forEach((s) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(s.radius, s.tube, 32, 100),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0.05, roughness: 0.06,
        transparent: true, opacity: 0.30, side: THREE.DoubleSide,
        envMapIntensity: 1.2,
      })
    );
    ring.position.set(s.pos[0], s.pos[1], s.pos[2]);
    ring.rotation.x = Math.PI / 2 + s.y;
    ring.rotation.y = s.rotY;
    group.add(ring);
    rings.push(ring);
  });

  // ---------- 水面（带顶点扰动的反射平面 + 高光） ----------
  const waterGeo = new THREE.PlaneGeometry(46, 46, 96, 96);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({
      color: 0x9fb6b8, metalness: 0.9, roughness: 0.22, envMapIntensity: 0.9, side: THREE.DoubleSide,
    })
  );
  water.position.y = -1.4;
  group.add(water);
  const waterBase = waterGeo.attributes.position.array.slice();

  // ---------- 岩石群 ----------
  const rocks = [];
  const rockMatVariants = [];
  const rockDefs = [
    { x: -7.5, z: -4, s: 2.4 }, { x: 6.5, z: -8, s: 3.0 }, { x: -2.2, z: -9, s: 1.8 },
    { x: 9.5, z: 1.5, s: 2.0 }, { x: -10, z: 4, s: 2.2 }, { x: -6, z: 4.5, s: 1.5 },
    { x: 8, z: -2, s: 1.6 }, { x: 0.5, z: -6, s: 1.3 }, { x: -9.5, z: -1, s: 1.7 },
    { x: 5, z: 9, s: 1.9 },
  ];
  rockDefs.forEach((d, i) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0xcfcdc7, roughness: 0.95, metalness: 0.02,
    });
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(d.s, 1), m);
    rock.position.set(d.x, d.s * 0.5 + (i % 3) * 0.4 - 1.4, d.z);
    rock.rotation.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
    rock.scale.y = 0.75 + Math.random() * 0.5;
    rockMatVariants.push(m);
    group.add(rock);
    rocks.push(rock);
  });

  // ---------- 金色粒子（环绕宝石微尘） ----------
  const N = 900;
  const pg = new THREE.BufferGeometry();
  const posA = new Float32Array(N * 3);
  const colA = new Float32Array(N * 3);
  const gold = new THREE.Color(0xD4AF37);
  const goldLight = new THREE.Color(0xf5e6a8);
  for (let i = 0; i < N; i++) {
    const r = 4 + Math.random() * 13;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    posA[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    posA[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.7 - 1.2;
    posA[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const c = gold.clone().lerp(goldLight, Math.random());
    colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b;
  }
  pg.setAttribute('position', new THREE.BufferAttribute(posA, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(colA, 3));
  const pm = new THREE.PointsMaterial({
    size: 0.13, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const particles = new THREE.Points(pg, pm);
  group.add(particles);

  // ---------- 渲染循环 ----------
  const onResize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();

  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();

    // 主题感知背景 / 水面色（亮暗切换时跟随）
    const p = cur();
    renderer.setClearColor(p.clear);
    water.material.color.set(p.water);
    water.material.specularColor?.set(p.waterGloss);

    // 相机：Lissajous 慢速绕行 + 鼠标视差平滑
    parallax.x += (parallax.tx - parallax.x) * 0.03;
    parallax.y += (parallax.ty - parallax.y) * 0.03;
    const px = Math.cos(t * 0.055) * camBase.r + parallax.x * 1.4;
    const pz = Math.sin(t * 0.068) * camBase.r + parallax.y * 1.0;
    const py = camBase.y + Math.sin(t * 0.033) * 0.9;
    camera.position.set(px, py, pz);
    camera.lookAt(0, 0.4, 0);

    // 场景整体随视差轻微倾斜（增强立体感）
    group.rotation.x += (parallax.y * -0.05 - group.rotation.x) * 0.02;
    group.rotation.y += (parallax.tx * 0.06 - group.rotation.y) * 0.02;

    // 玻璃环缓慢自转
    rings.forEach((ring, i) => {
      ring.rotation.z += (i % 2 ? -1 : 1) * 0.0018;
    });

    // 岩石缓慢自转
    rocks.forEach((r, i) => {
      r.rotation.y += 0.0006 * (i % 2 ? 1 : -1);
    });

    // 粒子旋转
    particles.rotation.y += 0.0008;

    // 水面扰动（涟漪）
    const pos = waterGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = waterBase[i], z = waterBase[i + 2];
      pos[i + 1] = Math.sin(x * 0.9 + t * 0.8) * 0.06 + Math.sin(z * 0.7 + t * 0.6) * 0.06;
    }
    waterGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  });

  // ---------- 鼠标视差 ----------
  window.addEventListener('pointermove', (e) => {
    parallax.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    parallax.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
}