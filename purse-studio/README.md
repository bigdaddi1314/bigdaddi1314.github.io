# Purse Studio

Purse Studio is a browser-based parametric designer for 3D-printable bags and purses. Use the 3D preview to adjust the shape and dimensions, review the print analysis, and export STL or 3MF files for your slicer.

## Run locally

Download [index.html](./index.html) using GitHub's **Download raw file** button and open the downloaded file in a browser with WebGL enabled. The app is self-contained and works offline.

To run it from a local checkout over HTTP, run this from the `purse-studio` folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

## Revise the app

Edit `index.html` in GitHub or in a local checkout. The file contains the interface, styles, design and analysis code, 3D renderer, and export logic. Reload the page to test changes before committing them.

## Version history

See the [changelog](./CHANGELOG.md) for what changed and the [GitHub releases](https://github.com/bigdaddi1314/3d-print-workshop/releases) for versioned downloads. Each Purse Studio release uses a tag such as `purse-studio-v4.0.0`.

When publishing an update:

1. Set `APP_VERSION` in `index.html` to the next version. For example, after 4.0.0 use 4.0.1 for a fix, 4.1.0 for a compatible feature, or 5.0.0 for a breaking change. The app title, header, and export metadata use this version.
2. Add a dated entry at the top of `CHANGELOG.md`. Open the app and verify that the new version appears in the header and the preview loads.
3. Commit the changes and publish a GitHub release from that commit. Name the tag `purse-studio-v<version>` and link to `purse-studio/index.html` at that tag so the app is available as a one-file download.
## New in 4.1.0

Choose one of the new carryall, duffel, or four clutch presets in Shape. The carryall has an open top and two handles. Clutch presets use shallow bodies with matching rigid lids.

Use **Import SVG silhouette** in Shape to select a single closed SVG outline. It defines the opening viewed from above. Set the width, depth, and body height in Size. SVG curves are sampled and simplified, and the app checks the outline and wall offsets before applying it. Save a .purse project to retain the imported shape. The existing logo importer remains available in Personalize.

In Size, enter custom item dimensions, move and rotate the item, and show its preview. Fit checks use sampled edges, straight insertion, and conservative bounds around interior obstructions. Results are estimates.

In Hardware, use **Download closure test STL** to export the current snap, magnet, or turn-lock parts on test grips. Print with the intended bag material and settings. Physical fit requires a real test print.

In Shape, save named variants to compare dimensions, estimated weight, plate count, and item fit. Variants live in the current browser. Use **Download .purse** to back them up or transfer them.
