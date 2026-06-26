# Draco Decoder

These files are copied from `three/examples/jsm/libs/draco` and are used by
`DRACOLoader` to decode Draco-compressed glTF/GLB assets in the browser.

The NASA ISS GLB in `public/models/nasa/iss-b.glb` uses Draco mesh compression,
so `GLTFLoader` needs these decoder assets at runtime.
