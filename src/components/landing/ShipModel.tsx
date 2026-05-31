"use client";

import { useEffect, useRef, useState } from "react";
import { ShipThree } from "./ShipThree";
import { addOcean } from "./oceanScene";

/**
 * ShipModel — loads a GLB hero ship from /public/models/exploration-bark.glb
 * into the dark sea + starfield, and rotates it. Supports Draco/Meshopt-
 * compressed GLBs (what Meshy / Tripo / Luma export). If the file is missing
 * or fails to decode, it falls back to the procedural ShipThree.
 *
 * To use a real model: generate a GLB from the hero artwork via Meshy / Tripo /
 * Luma (image → 3D → download GLB) and save it as
 *   public/models/exploration-bark.glb
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
     try {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
      const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const w = el.clientWidth || 600;
      const h = el.clientHeight || 600;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
      camera.position.set(0.8, 1.7, 8.2);
      camera.lookAt(0, 0.4, 0);

      // PBR environment + moody navy/teal/gold lighting (matches the hero art).
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.add(new THREE.AmbientLight(0x16243c, 1.2));
      const moon = new THREE.DirectionalLight(0x9fd0ff, 1.1);
      moon.position.set(4, 7, 5);
      scene.add(moon);
      const teal = new THREE.PointLight(0x5bd2c7, 6, 26);
      teal.position.set(-3, 1.5, 3);
      scene.add(teal);
      const gold = new THREE.PointLight(0xe4b66b, 4, 22);
      gold.position.set(3.5, 3, -1);
      scene.add(gold);

      const ocean = addOcean(THREE, scene);

      const pivot = new THREE.Group();
      scene.add(pivot);

      const draco = new DRACOLoader();
      draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      loader.setMeshoptDecoder(MeshoptDecoder);

      loader.load(
        MODEL_URL,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          // Center, scale to a consistent size, then rest it on the sea.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.scale.setScalar(4.0 / maxDim);
          const box2 = new THREE.Box3().setFromObject(model);
          model.position.y -= box2.min.y + 0.45; // bottom just above the sea
          pivot.add(model);
        },
        undefined,
        () => {
          // Missing file / decode error → procedural fallback.
          if (!disposed) setFailed(true);
        }
      );

      let t = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.005;
        pivot.rotation.y = t * 0.3;
        pivot.position.y = Math.sin(t * 0.9) * 0.08;
        pivot.rotation.z = Math.sin(t * 0.5) * 0.03;
        ocean.update(t);
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
        ocean.dispose();
        draco.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
      };
     } catch {
       // Any loader/setup failure → procedural fallback, never a blank hero.
       if (!disposed) setFailed(true);
     }
    })();

    return () => {
      disposed = true;
      cleanupFn?.();
    };
  }, [failed]);

  if (failed) return <ShipThree />;
  return <div ref={mountRef} className="h-full w-full" />;
}
