# Motor Story Asset Pipeline

This folder produces the FOC project's assembled-to-exploded WebP sequence.
The generator is intentionally offline: Blender and the source CAD never enter
the production JavaScript bundle.

## Current Reference Asset

- Object: mjbots qdd100 beta 3 quasi-direct-drive servo
- Vendor/source: mjbots Robotic Systems
- Product page: <https://mjbots.com/products/qdd100-beta-3>
- CAD download: linked as `3D STEP File` on the product page
- Role: exterior reference geometry for a personal engineering-story prototype
- Attribution: `qdd100 beta 3 mechanical reference courtesy of mjbots`
- Accuracy: reference only; it is not the exact hardware tested in this project

The source STEP is not committed. The render adds generic internal motor parts
to communicate FOC structure. Replace the reference with the owner's own named
assembly before presenting the page as an exact digital twin.

## Generate

1. Download the official STEP file to a local working directory.
2. Convert the STEP assembly to OBJ:

```powershell
node tools/motor-story/step-to-obj.mjs `
  C:\path\to\qdd100.step `
  C:\temp\motor-reference.obj
```

3. Run Blender 4.5 LTS or newer in background mode:

```powershell
& C:\path\to\blender.exe --background --python `
  tools/motor-story/render_motor_story.py -- `
  --input C:\temp\motor-reference.obj `
  --output public\images\projects\motor-control\story
```

4. Verify `poster.webp` and frames `frame-0001.webp` through
   `frame-0080.webp`. Keep the complete directory below 12 MB; lower WebP
   quality or render resolution if needed.

## Replace With Project CAD

Keep the axial assembly direction on Blender Z. Name or group the main parts as
front cover, bearing, rotor, stator, housing, encoder, and rear cover. Adjust
only the `keyframe_part` calls in `render_motor_story.py`; the website consumes
the numbered frames and does not know model coordinates.

Update `asset.json` with the new source, attribution, and `referenceOnly` flag.

