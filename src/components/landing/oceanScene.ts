/**
 * Shared dark-ocean atmosphere for the hero ship scenes — a teal hexagonal
 * grid sea + a starfield. Used by both the procedural ShipThree and the GLB
 * ShipModel so the ship looks at home either way. Pass the (dynamically
 * imported) three module + scene; returns update/dispose handles.
 */

type ThreeModule = typeof import("three");
type Scene = import("three").Scene;

export interface OceanHandles {
  update: (t: number) => void;
  dispose: () => void;
}

export function addOcean(THREE: ThreeModule, scene: Scene): OceanHandles {
  // ── Teal hexagonal grid sea ──
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.strokeStyle = "rgba(91,210,199,0.7)";
  ctx.lineWidth = 1.5;
  const r = 26;
  const hw = Math.sqrt(3) * r;
  const hex = (cx: number, cy: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };
  for (let row = -1; row < 8; row++) {
    for (let col = -1; col < 8; col++) {
      hex(col * hw + (row % 2 ? hw / 2 : 0), row * r * 1.5);
    }
  }
  const seaTex = new THREE.CanvasTexture(canvas);
  seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;
  seaTex.repeat.set(7, 7);
  const seaMat = new THREE.MeshBasicMaterial({
    map: seaTex,
    transparent: true,
    opacity: 0.5,
    color: 0x5bd2c7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.7;
  scene.add(sea);

  // ── Starfield (deterministic positions so it's stable) ──
  const count = 320;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = ((Math.sin(i * 12.9) * 43758.5) % 1) * 60 - 30;
    pos[i * 3 + 1] = Math.abs((Math.sin(i * 78.2) * 12543.1) % 1) * 22 + 1;
    pos[i * 3 + 2] = ((Math.sin(i * 39.4) * 9281.7) % 1) * 50 - 35;
  }
  const starMat = new THREE.PointsMaterial({
    color: 0xbfe6ff,
    size: 0.08,
    transparent: true,
    opacity: 0.8,
  });
  const starGeo = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute(pos, 3)
  );
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  return {
    update(t: number) {
      seaTex.offset.y = t * 0.02;
      starMat.opacity = 0.65 + Math.sin(t * 1.5) * 0.15;
    },
    dispose() {
      scene.remove(sea);
      scene.remove(stars);
      seaTex.dispose();
      seaMat.dispose();
      sea.geometry.dispose();
      starGeo.dispose();
      starMat.dispose();
    },
  };
}
