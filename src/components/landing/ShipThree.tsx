"use client";

import { useEffect, useRef } from "react";

/**
 * Procedural galleon — self-contained Three.js, no external model files.
 * Wooden hull + stern castle + three masts with cream sails and a gold
 * pennant, lit by an upper-right "sun" to read against the light hero sky.
 * Slow turntable rotation with a gentle bob and roll.
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

      const w = el.clientWidth || 560;
      const h = el.clientHeight || 560;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
      camera.position.set(0.4, 1.7, 7.4);
      camera.lookAt(0, 0.45, 0);

      // ── Lighting: bright sky + upper-right sun + warm gold rim ──
      scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x9a7b54, 1.5));
      const sun = new THREE.DirectionalLight(0xffffff, 2.4);
      sun.position.set(5, 8, 4);
      scene.add(sun);
      const rim = new THREE.PointLight(0xe4b66b, 7, 24);
      rim.position.set(-4, 2.5, -3);
      scene.add(rim);

      // ── Materials ──
      const woodDark = new THREE.MeshStandardMaterial({
        color: 0x5b3a1e,
        roughness: 0.75,
        metalness: 0.05,
      });
      const woodMid = new THREE.MeshStandardMaterial({
        color: 0x7a4e28,
        roughness: 0.7,
        metalness: 0.05,
      });
      const sailMat = new THREE.MeshStandardMaterial({
        color: 0xf3ead4,
        roughness: 0.95,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xe4b66b,
        emissive: 0xe4b66b,
        emissiveIntensity: 0.3,
        roughness: 0.25,
        metalness: 1,
      });

      const ship = new THREE.Group();

      // ── Hull (extruded side profile) ──
      const hull = new THREE.Shape();
      hull.moveTo(-2.1, 0.0);
      hull.lineTo(-2.25, 0.95); // tall stern castle
      hull.lineTo(-1.4, 0.88);
      hull.lineTo(-1.5, 0.32); // step down to waist
      hull.lineTo(1.8, 0.28);
      hull.lineTo(2.6, 0.62); // raised bow prow
      hull.lineTo(2.4, 0.12);
      hull.quadraticCurveTo(2.25, -0.5, 1.2, -0.56);
      hull.lineTo(-1.0, -0.56); // keel
      hull.quadraticCurveTo(-1.9, -0.5, -2.1, 0.0);

      const beam = 1.3;
      const hullGeo = new THREE.ExtrudeGeometry(hull, {
        depth: beam,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.06,
        bevelSegments: 2,
      });
      hullGeo.translate(0, 0, -beam / 2);
      const hullMesh = new THREE.Mesh(hullGeo, woodMid);
      ship.add(hullMesh);

      // Gold trim stripe along the sheer line
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.06, beam + 0.16),
        goldMat
      );
      trim.position.set(0.1, 0.3, 0);
      ship.add(trim);

      // ── Masts + yards + sails ──
      const masts: Array<{ x: number; height: number; sails: number[] }> = [
        { x: 1.0, height: 2.1, sails: [1.45, 0.95] },
        { x: -0.2, height: 2.8, sails: [1.95, 1.35, 0.8] },
        { x: -1.25, height: 1.8, sails: [1.25, 0.75] },
      ];

      for (const m of masts) {
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.07, m.height, 12),
          woodDark
        );
        mast.position.set(m.x, 0.3 + m.height / 2, 0);
        ship.add(mast);

        m.sails.forEach((yardY, i) => {
          // Yard (horizontal spar)
          const yard = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, beam + 0.5, 8),
            woodDark
          );
          yard.rotation.x = Math.PI / 2;
          yard.position.set(m.x, 0.3 + yardY, 0);
          ship.add(yard);

          // Sail below the yard
          const sailW = beam + 0.35 - i * 0.18;
          const sailH = 0.7 - i * 0.08;
          const sail = new THREE.Mesh(
            new THREE.PlaneGeometry(sailW, sailH, 8, 4),
            sailMat
          );
          // Gentle billow
          const pos = sail.geometry.attributes.position;
          for (let p = 0; p < pos.count; p++) {
            const x = pos.getX(p);
            pos.setZ(p, Math.cos((x / sailW) * Math.PI) * 0.12);
          }
          pos.needsUpdate = true;
          sail.geometry.computeVertexNormals();
          sail.rotation.y = Math.PI / 2;
          sail.position.set(m.x, 0.3 + yardY - sailH / 2 - 0.04, 0);
          ship.add(sail);
        });

        // Mast-top gold finial
        const finial = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 12, 12),
          goldMat
        );
        finial.position.set(m.x, 0.3 + m.height, 0);
        ship.add(finial);
      }

      // ── Bowsprit ──
      const bowsprit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 1.3, 8),
        woodDark
      );
      bowsprit.position.set(2.7, 0.7, 0);
      bowsprit.rotation.z = Math.PI / 2.6;
      ship.add(bowsprit);

      // ── Pennant flag atop the mainmast ──
      const flagGeo = new THREE.PlaneGeometry(0.55, 0.22, 10, 1);
      const flag = new THREE.Mesh(flagGeo, goldMat);
      flag.position.set(-0.2 + 0.3, 0.3 + 2.8 - 0.05, 0);
      ship.add(flag);

      ship.scale.setScalar(1.05);
      ship.position.y = -0.2;
      scene.add(ship);

      // ── Animation ──
      let t = 0;
      const flagPos = flagGeo.attributes.position;
      const flagBase = Array.from(
        { length: flagPos.count },
        (_, i) => flagPos.getX(i)
      );

      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.006;

        ship.rotation.y = t * 0.32; // turntable
        ship.position.y = -0.2 + Math.sin(t * 0.9) * 0.1; // bob
        ship.rotation.z = Math.sin(t * 0.55) * 0.04; // roll

        // Flag wave
        for (let i = 0; i < flagPos.count; i++) {
          const x = flagBase[i];
          flagPos.setZ(i, Math.sin(x * 6 + t * 6) * 0.06 * (x + 0.28));
        }
        flagPos.needsUpdate = true;

        renderer.render(scene, camera);
      }
      animate();

      const ro = new ResizeObserver(() => {
        const nw = el.clientWidth || 560;
        const nh = el.clientHeight || 560;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      });
      ro.observe(el);

      cleanupFn = () => {
        cancelAnimationFrame(animId);
        ro.disconnect();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
      };
    })();

    return () => cleanupFn?.();
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
