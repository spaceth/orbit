# Satellite GLB assets

Place one binary glTF (`.glb`) file at each configured public path:

- `theos-2.glb`
- `knacksat-2.glb`
- `theos.glb`
- `thaicom-4.glb`
- `thaicom-6.glb`
- `thaicom-7.glb`
- `thaicom-8.glb`

The registry entries live in `src/data/satellites.ts`. Every tracked, legacy,
and future satellite record accepts the same optional `model` object. Legacy
and future spacecraft use it in the detail preview; tracked spacecraft also use
it as their orbit marker.

Models are normalized from their bounding box, so source units do not need to
match one another. Use `scale`, `rotation`, and `offset` in the registry for
per-model visual correction. Missing or invalid files fall back to the existing
sphere marker/preview. The client checks each configured local path before
starting the GLTF loader, so this prepared registry remains quiet while model
files are still being collected.

Prefer optimized, self-contained GLB files with embedded textures. Record the
creator, source URL, and license in `credit`, `creditUrl`, and `license` before
publishing an externally sourced model.
