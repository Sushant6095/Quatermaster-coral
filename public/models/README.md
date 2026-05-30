# 3D models

The hero ship loads `exploration-bark.glb` from this folder.

## To use the Sketchfab "Exploration Bark" model

1. Open the model:
   https://sketchfab.com/3d-models/exploration-bark-4fd8d8ab344f4a71a9dd8946b475c5b7
2. Click **Download 3D Model** → choose the **glTF Binary (.glb)** option
   (a free Sketchfab account is required; check the model's license — credit
   the author per its CC terms).
3. Save the file here as **`exploration-bark.glb`** (exact name).

When the file is present, `ShipModel` loads it automatically. Until then, the
hero falls back to the procedural galleon (`ShipThree`) — no broken state.
