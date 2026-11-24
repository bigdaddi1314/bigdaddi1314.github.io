# Purse Studio changelog

## 4.1.0 · 2026-11-17

- Added Carryall Tote, Barrel Duffel, Envelope, Pill, Half-Moon, and Art Deco shape presets with three sizes.
- Added SVG silhouette import for a single closed path, polygon, rectangle, circle, or ellipse. Transformed outlines are sampled, simplified, checked, and used to generate a hollow body and matching lid. Concave caps use triangulation.
- Added item position, rotation, elevation, orientation search, sampled cavity checks, and conservative obstruction checks. The item preview follows the tested orientation.
- Added closure test STL export using the current snap, magnet, or turn-lock geometry with separate grips.
- Added named browser-local design variants with dimension comparison, estimated weight, plate count, fit result, restore, and portable project download.
- Fixed a folded handle mesh and removed requests for the absent worker script in the standalone distribution.

### Validation and scope

Checked 63 preset/size combinations for closed body and lid meshes, convex and concave SVG shells at four quality levels, item-fit regressions, browser import/restore/rejection, project round-trip, and closure STL generation. Physical printing and assembly remain unverified.

SVG outlines define the bag opening in top view. Curves are sampled and simplified. Use one closed outline without holes. Tight offsets or intersecting outlines display an error. Saved projects retain the sampled outline. Fit results use sampled edges, straight insertion, and conservative obstruction bounds. Variants are stored in the current browser and can be downloaded as .purse files.

## 4.0.0 · 2026-11-17

- First GitHub release of Purse Studio v4, including guided and advanced design modes, a 3D preview, print analysis, printer calibration, and STL and 3MF export.
- The app header and browser title now show the full version number used in saved projects and exports.