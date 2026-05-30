"use client";

import { useEffect, useRef, useState } from "react";
import { ShipThree } from "./ShipThree";

/**
 * ShipModel — loads the Sketchfab "Exploration Bark" GLB from
 * /public/models/exploration-bark.glb and rotates it. If the file is absent
 * (or fails to load) it transparently falls back to the procedural galleon,
 * so the hero is never empty.
 *
 * To use the real model: download the glTF/GLB from
 *   https://sketchfab.com/3d-models/exploration-bark-4fd8d8ab344f4a71a9dd8946b475c5b7
 * and save it as  public/models/exploration-bark.glb
 */
const MODEL_URL = "/models/exploration-bark.glb";

export function ShipModel() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    const el = mountRef.current;
    if (!el) return;

    let animId: number;
    let disposed = false;
    let cleanupFn: (() => void) | undefined;

    void (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      if (disposed) return;

      const w = el.clientWidth || 560;
      const h = el.clientHeight || 560;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      camera.position.set(0.6, 1.4, 7.6);
      camera.lookAt(0, 0.3, 0);

      // PBR environment so the model's materials read correctly.
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;

      scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x9a7b54, 1.2));
      const sun = new THREE.DirectionalLight(0xffffff, 2.2);
      sun.position.set(5, 8, 4);
      scene.add(sun);

      const pivot = new THREE.Group();
      scene.add(pivot);

      const loader = new GLTFLoader();
      loader.load(
        MODEL_URL,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          // Center + scale to a consistent size.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.scale.setScalar(3.6 / maxDim);
          pivot.add(model);
        },
        undefined,
        () => {
          // File missing / decode error → procedural fallback.
          if (!disposed) setFailed(true);
        }
      );

      let t = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.006;
        pivot.rotation.y = t * 0.32;
        pivot.position.y = Math.sin(t * 0.9) * 0.1;
        pivot.rotation.z = Math.sin(t * 0.55) * 0.03;
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
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanupFn?.();
    };
  }, [failed]);

  if (failed) return <ShipThree />;
  return <div ref={mountRef} className="h-full w-full" />;
}
