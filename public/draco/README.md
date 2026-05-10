This folder should contain DRACO decoder files used by `three/examples/jsm/loaders/DRACOLoader`.

You can obtain them automatically by running the Node script at the repository root:

```bash
node scripts/fetch-draco.js
```

Files placed here:

- draco_decoder.js
- draco_decoder.wasm
- draco_wasm_wrapper.js

If you prefer manual download, fetch them from Google's CDN, for example:
https://www.gstatic.com/draco/versioned/decoders/1.4.3/

Make sure the files are served at `/draco/` (Vite serves `public/` at the root by default).
