# 3D models

The hero ship (`ShipModel`) loads **`exploration-bark.glb`** from this folder.
When the file is present it loads automatically (Draco/Meshopt-compressed GLBs
are supported); until then the hero falls back to the procedural `ShipThree`.

## Generate a GLB from the hero artwork (image → 3D)

I can't run image-to-3D here, so generate it with a free tool and drop the file in:

1. Open an image-to-3D generator:
   - **Meshy** — https://www.meshy.ai (Image to 3D)
   - **Tripo** — https://www.tripo3d.ai
   - **Luma Genie** — https://lumalabs.ai/genie
2. Upload the hero image, generate, and **download as GLB** (glTF Binary).
   - If asked, enable texture/PBR export. Draco or Meshopt compression is fine.
3. Save it here as exactly **`exploration-bark.glb`**.
4. Commit + push — it swaps into the hero automatically (centered, scaled,
   rested on the sea, slow-rotating in the dark starfield scene).

If the model loads facing the wrong way or too big/small, tell me and I'll tweak
the rotation/scale in `src/components/landing/ShipModel.tsx`.
