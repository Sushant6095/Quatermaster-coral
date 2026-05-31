"use client";

import { useEffect, useRef } from "react";

/**
 * Procedural "constellation galleon" — a self-contained Three.js scene that
 * matches the hero artwork: dark navy hull with glowing teal portholes, a gold
 * compass-rose mainsail, wireframe-glow rigging, a teal hexagonal-grid sea, and
 * a starfield. No external model files. Slow turntable + gentle bob.
 */
export function ShipThree() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let animId: number;
    let cleanupFn: (() => void) | undefined;

    void (async () => {
      const THREE = await import("three");

      const w = el.clientWidth || 600;
      const h = el.clientHeight || 600;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
      camera.position.set(1.6, 1.9, 8.2);
      camera.lookAt(0, 0.5, 0);

      // ── Moody navy lighting + teal/gold rim ──
      scene.add(new THREE.AmbientLight(0x16243c, 1.4));
      const moon = new THREE.DirectionalLight(0x9fd0ff, 0.9);
      moon.position.set(4, 7, 5);
      scene.add(moon);
      const teal = new THREE.PointLight(0x5bd2c7, 7, 26);
      teal.position.set(-3, 1.5, 3);
      scene.add(teal);
      const gold = new THREE.PointLight(0xe4b66b, 5, 22);
      gold.position.set(3.5, 3, -1);
      scene.add(gold);

      // ── Canvas-texture helpers ──
      function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        return [c, c.getContext("2d") as CanvasRenderingContext2D];
      }

      // Faint teal grid on translucent navy — the "constellation" sail fabric.
      function gridTexture() {
        const [c, ctx] = makeCanvas(256);
        ctx.fillStyle = "rgba(11,22,40,0.55)";
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = "rgba(91,210,199,0.35)";
        ctx.lineWidth = 1;
        const step = 28;
        for (let i = 0; i <= 256; i += step) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
        }
        // node dots
        ctx.fillStyle = "rgba(91,210,199,0.6)";
        for (let x = 0; x <= 256; x += step)
          for (let y = 0; y <= 256; y += step) {
            ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill();
          }
        const t = new THREE.CanvasTexture(c);
        return t;
      }

      // Gold compass rose on transparent — overlaid on the mainsail.
      function compassTexture() {
        const [c, ctx] = makeCanvas(256);
        const cx = 128, cy = 128;
        ctx.strokeStyle = "rgba(228,182,107,0.95)";
        ctx.fillStyle = "rgba(228,182,107,0.95)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 86, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.stroke();
        // 8-point star
        const star = (r1: number, r2: number, rot: number) => {
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = rot + (i * Math.PI) / 4;
            const r = i % 2 === 0 ? r1 : r2;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.closePath(); ctx.fill();
        };
        star(66, 16, -Math.PI / 2);
        ctx.globalAlpha = 0.55;
        star(40, 12, -Math.PI / 2 + Math.PI / 4);
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        return new THREE.CanvasTexture(c);
      }

      // Teal hexagonal grid — the sea floor.
      function hexTexture() {
        const [c, ctx] = makeCanvas(256);
        ctx.clearRect(0, 0, 256, 256);
        ctx.strokeStyle = "rgba(91,210,199,0.7)";
        ctx.lineWidth = 1.5;
        const r = 26, hw = Math.sqrt(3) * r;
        const hex = (cx: number, cy: number) => {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 180) * (60 * i - 30);
            const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.closePath(); ctx.stroke();
        };
        for (let row = -1; row < 8; row++)
          for (let col = -1; col < 8; col++) {
            const cx = col * hw + (row % 2 ? hw / 2 : 0);
            const cy = row * r * 1.5;
            hex(cx, cy);
          }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(7, 7);
        return t;
      }

      const grid = gridTexture();
      const compass = compassTexture();

      // ── Materials ──
      const hullMat = new THREE.MeshStandardMaterial({
        color: 0x0e1d33, roughness: 0.55, metalness: 0.4,
        emissive: 0x0a1626, emissiveIntensity: 0.35,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xe4b66b, emissive: 0xe4b66b, emissiveIntensity: 0.55,
        metalness: 1, roughness: 0.25,
      });
      const portholeMat = new THREE.MeshStandardMaterial({
        color: 0x0a1a20, emissive: 0x5bd2c7, emissiveIntensity: 2.4,
      });
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x16233a, roughness: 0.7 });
      const sailMat = new THREE.MeshStandardMaterial({
        color: 0x0c1830, map: grid, emissive: 0x163a44, emissiveIntensity: 0.5,
        emissiveMap: grid, transparent: true, opacity: 0.92, side: THREE.DoubleSide,
      });
      const compassMat = new THREE.MeshStandardMaterial({
        map: compass, emissive: 0xe4b66b, emissiveIntensity: 0.7, emissiveMap: compass,
        transparent: true, side: THREE.DoubleSide, depthWrite: false,
      });

      const ship = new THREE.Group();

      // ── Hull (extruded profile) ──
      const hull = new THREE.Shape();
      hull.moveTo(-2.1, 0.0);
      hull.lineTo(-2.25, 0.95);
      hull.lineTo(-1.4, 0.88);
      hull.lineTo(-1.5, 0.32);
      hull.lineTo(1.8, 0.28);
      hull.lineTo(2.6, 0.62);
      hull.lineTo(2.4, 0.12);
      hull.quadraticCurveTo(2.25, -0.5, 1.2, -0.56);
      hull.lineTo(-1.0, -0.56);
      hull.quadraticCurveTo(-1.9, -0.5, -2.1, 0.0);
      const beam = 1.3;
      const hullGeo = new THREE.ExtrudeGeometry(hull, {
        depth: beam, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2,
      });
      hullGeo.translate(0, 0, -beam / 2);
      ship.add(new THREE.Mesh(hullGeo, hullMat));

      // Gold sheer trim
      const trim = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, beam + 0.18), goldMat);
      trim.position.set(0.1, 0.3, 0);
      ship.add(trim);

      // ── Glowing teal portholes (two rows, both sides) ──
      const phGeo = new THREE.BoxGeometry(0.1, 0.1, 0.04);
      for (const side of [1, -1]) {
        for (let row = 0; row < 2; row++) {
          for (let i = 0; i < 9; i++) {
            const ph = new THREE.Mesh(phGeo, portholeMat);
            ph.position.set(-1.3 + i * 0.36, -0.05 + row * 0.26, side * (beam / 2 + 0.06));
            ship.add(ph);
          }
        }
      }

      // ── Masts + sails ──
      const masts = [
        { x: 1.0, height: 2.2, sails: [1.5, 1.0] },
        { x: -0.2, height: 2.95, sails: [2.1, 1.45, 0.85], compass: 1.45 },
        { x: -1.25, height: 1.9, sails: [1.3, 0.8] },
      ] as const;

      for (const m of masts) {
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.07, m.height, 10), mastMat
        );
        mast.position.set(m.x, 0.3 + m.height / 2, 0);
        ship.add(mast);

        m.sails.forEach((yardY, i) => {
          const yard = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.028, beam + 0.5, 8), mastMat
          );
          yard.rotation.x = Math.PI / 2;
          yard.position.set(m.x, 0.3 + yardY, 0);
          ship.add(yard);

          const sailW = beam + 0.4 - i * 0.18;
          const sailH = 0.78 - i * 0.08;
          const sail = new THREE.Mesh(new THREE.PlaneGeometry(sailW, sailH, 6, 4), sailMat);
          const pos = sail.geometry.attributes.position;
          for (let p = 0; p < pos.count; p++) {
            pos.setZ(p, Math.cos((pos.getX(p) / sailW) * Math.PI) * 0.1);
          }
          pos.needsUpdate = true;
          sail.geometry.computeVertexNormals();
          sail.rotation.y = Math.PI / 2;
          sail.position.set(m.x, 0.3 + yardY - sailH / 2 - 0.04, 0);
          ship.add(sail);
        });

        if ("compass" in m && m.compass) {
          const cp = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), compassMat);
          cp.rotation.y = Math.PI / 2;
          cp.position.set(m.x, 0.3 + m.compass - 0.42, 0.02);
          ship.add(cp);
        }

        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), goldMat);
        finial.position.set(m.x, 0.3 + m.height, 0);
        ship.add(finial);
      }

      // ── Bowsprit + pennant ──
      const bowsprit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 1.3, 8), mastMat
      );
      bowsprit.position.set(2.7, 0.7, 0);
      bowsprit.rotation.z = Math.PI / 2.6;
      ship.add(bowsprit);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), goldMat);
      flag.position.set(0.1, 0.3 + 2.95 - 0.05, 0);
      ship.add(flag);

      // ── Wireframe-glow rigging ──
      const rigPts: number[] = [];
      for (const m of masts) {
        rigPts.push(m.x, 0.3 + m.height, 0, m.x + 1.0, 0.4, 0);
        rigPts.push(m.x, 0.3 + m.height, 0, m.x - 1.0, 0.4, 0);
      }
      const rig = new THREE.LineSegments(
        new THREE.BufferGeometry().setAttribute(
          "position", new THREE.Float32BufferAttribute(rigPts, 3)
        ),
        new THREE.LineBasicMaterial({ color: 0x5bd2c7, transparent: true, opacity: 0.4 })
      );
      ship.add(rig);

      ship.scale.setScalar(1.0);
      ship.position.y = 0.1;
      scene.add(ship);

      // ── Hex-grid sea (does not rotate with the ship) ──
      const seaTex = hexTexture();
      const sea = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshBasicMaterial({
          map: seaTex, transparent: true, opacity: 0.5, color: 0x5bd2c7,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.y = -0.7;
      scene.add(sea);

      // ── Starfield ──
      const starCount = 320;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.sin(i * 12.9) * 43758.5) % 1 * 60 - 30;
        starPos[i * 3 + 1] = Math.abs((Math.sin(i * 78.2) * 12543.1) % 1) * 22 + 1;
        starPos[i * 3 + 2] = (Math.sin(i * 39.4) * 9281.7) % 1 * 50 - 35;
      }
      const starMat = new THREE.PointsMaterial({
        color: 0xbfe6ff, size: 0.08, transparent: true, opacity: 0.8,
      });
      const stars = new THREE.Points(
        new THREE.BufferGeometry().setAttribute(
          "position", new THREE.Float32BufferAttribute(starPos, 3)
        ),
        starMat
      );
      scene.add(stars);

      // ── Animation ──
      let t = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.005;
        ship.rotation.y = t * 0.3;
        ship.position.y = 0.1 + Math.sin(t * 0.9) * 0.08;
        ship.rotation.z = Math.sin(t * 0.5) * 0.03;
        seaTex.offset.y = t * 0.02;
        starMat.opacity = 0.65 + Math.sin(t * 1.5) * 0.15;
        renderer.render(scene, camera);
      }
      animate();

      const ro = new ResizeObserver(() => {
        const nw = el.clientWidth || 600;
        const nh = el.clientHeight || 600;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      });
      ro.observe(el);

      cleanupFn = () => {
        cancelAnimationFrame(animId);
        ro.disconnect();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      };
    })();

    return () => cleanupFn?.();
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
