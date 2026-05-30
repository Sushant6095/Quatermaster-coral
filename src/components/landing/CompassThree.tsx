"use client";

import { useEffect, useRef } from "react";

/** Self-contained Three.js animated compass rose — no external URLs needed. */
export function CompassThree() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let animId: number;
    let cleanupFn: (() => void) | undefined;

    void (async () => {
      const THREE = await import("three");

      const w = el.clientWidth || 520;
      const h = el.clientHeight || 520;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      // Scene + camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 3.5, 6);
      camera.lookAt(0, 0, 0);

      // Lighting
      scene.add(new THREE.AmbientLight(0x334466, 2));
      const gold = new THREE.PointLight(0xe4b66b, 8, 12);
      gold.position.set(2, 3, 2);
      scene.add(gold);
      const coral = new THREE.PointLight(0xff7a6b, 4, 10);
      coral.position.set(-2, -1, 3);
      scene.add(coral);
      const sea = new THREE.PointLight(0x5bd2c7, 3, 8);
      sea.position.set(0, 2, -2);
      scene.add(sea);

      // ---- Compass base ring ----
      const ringGeo = new THREE.TorusGeometry(2.2, 0.06, 16, 80);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xe4b66b,
        emissive: 0xe4b66b,
        emissiveIntensity: 0.25,
        roughness: 0.3,
        metalness: 0.9,
      });
      scene.add(new THREE.Mesh(ringGeo, ringMat));

      // Inner ring
      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.03, 16, 80),
        new THREE.MeshStandardMaterial({ color: 0x22324f, roughness: 0.6, metalness: 0.5 })
      );
      scene.add(innerRing);

      // ---- Compass face disc ----
      const faceGeo = new THREE.CylinderGeometry(2.18, 2.18, 0.06, 64);
      const faceMat = new THREE.MeshStandardMaterial({
        color: 0x0f1a2e,
        roughness: 0.7,
        metalness: 0.3,
      });
      scene.add(new THREE.Mesh(faceGeo, faceMat));

      // ---- 8 cardinal tick marks ----
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const isCardinal = i % 2 === 0;
        const len = isCardinal ? 0.35 : 0.2;
        const thick = isCardinal ? 0.04 : 0.025;
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(thick, 0.08, len),
          new THREE.MeshStandardMaterial({
            color: isCardinal ? 0xe4b66b : 0x2e4366,
            emissive: isCardinal ? 0xe4b66b : 0x000000,
            emissiveIntensity: isCardinal ? 0.4 : 0,
            metalness: 0.8,
            roughness: 0.2,
          })
        );
        tick.position.set(
          Math.sin(angle) * 1.92,
          0.07,
          Math.cos(angle) * 1.92
        );
        tick.rotation.y = -angle;
        scene.add(tick);
      }

      // ---- 32 small tick marks ----
      for (let i = 0; i < 32; i++) {
        if (i % 4 === 0) continue; // skip cardinal positions
        const angle = (i / 32) * Math.PI * 2;
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.06, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x22324f, metalness: 0.5, roughness: 0.5 })
        );
        tick.position.set(Math.sin(angle) * 2.0, 0.06, Math.cos(angle) * 2.0);
        tick.rotation.y = -angle;
        scene.add(tick);
      }

      // ---- North needle (coral/red) ----
      const group = new THREE.Group();

      const northShape = new THREE.Shape();
      northShape.moveTo(0, 0);
      northShape.lineTo(-0.12, -0.6);
      northShape.lineTo(0, 1.4);
      northShape.lineTo(0.12, -0.6);
      northShape.closePath();
      const northGeo = new THREE.ExtrudeGeometry(northShape, { depth: 0.05, bevelEnabled: false });
      const northMesh = new THREE.Mesh(
        northGeo,
        new THREE.MeshStandardMaterial({
          color: 0xff7a6b,
          emissive: 0xff7a6b,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          metalness: 0.6,
        })
      );
      northMesh.rotation.x = -Math.PI / 2;
      northMesh.position.set(-0.025, 0.12, 0);
      group.add(northMesh);

      // South needle (dark gold)
      const southShape = new THREE.Shape();
      southShape.moveTo(0, 0);
      southShape.lineTo(-0.1, -0.5);
      southShape.lineTo(0, 1.1);
      southShape.lineTo(0.1, -0.5);
      southShape.closePath();
      const southGeo = new THREE.ExtrudeGeometry(southShape, { depth: 0.04, bevelEnabled: false });
      const southMesh = new THREE.Mesh(
        southGeo,
        new THREE.MeshStandardMaterial({
          color: 0xc8973f,
          roughness: 0.4,
          metalness: 0.8,
        })
      );
      southMesh.rotation.x = -Math.PI / 2;
      southMesh.rotation.z = Math.PI;
      southMesh.position.set(-0.02, 0.12, 0);
      group.add(southMesh);

      scene.add(group);

      // ---- Center hub ----
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.2, 32),
        new THREE.MeshStandardMaterial({
          color: 0xe4b66b,
          emissive: 0xe4b66b,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 1.0,
        })
      );
      hub.position.y = 0.12;
      scene.add(hub);

      // ---- Decorative cross lines ----
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI;
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.05, 4.2),
          new THREE.MeshStandardMaterial({ color: 0x22324f, roughness: 0.8 })
        );
        line.rotation.y = angle;
        line.position.y = 0.04;
        scene.add(line);
      }

      // ---- Floating glow ring (below compass) ----
      const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.4, 0.3, 8, 80),
        new THREE.MeshStandardMaterial({
          color: 0xe4b66b,
          emissive: 0xe4b66b,
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: 0.12,
          roughness: 1,
        })
      );
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.y = -0.4;
      scene.add(glowRing);

      // Animation loop
      let t = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.005;

        // Slow compass body rotation
        scene.rotation.y = t * 0.3;
        // Needle counter-rotates slightly (like a real compass)
        group.rotation.y = -t * 0.3 + Math.sin(t * 0.2) * 0.08;

        // Subtle bob
        scene.position.y = Math.sin(t * 0.8) * 0.08;

        // Gold light orbit
        gold.position.x = Math.cos(t * 0.5) * 3;
        gold.position.z = Math.sin(t * 0.5) * 3;

        renderer.render(scene, camera);
      }
      animate();

      // Resize
      const ro = new ResizeObserver(() => {
        const nw = el.clientWidth || 520;
        const nh = el.clientHeight || 520;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      });
      ro.observe(el);

      cleanupFn = () => {
        cancelAnimationFrame(animId);
        ro.disconnect();
        renderer.dispose();
        el.removeChild(renderer.domElement);
      };
    })();

    return () => cleanupFn?.();
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
