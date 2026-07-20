# Design QA: Persistent free camera angle

- Source visual truth: `conversation://attachment/1` and `conversation://attachment/2`, plus the requirement that clicking an already-selected list item or its GLB must not return the camera to its initial focus angle.
- Implementation screenshots: `.design-qa/camera-angle-repeat-baseline.png`, `.design-qa/camera-angle-repeat-after.png`, `.design-qa/camera-angle-after-model-click.png`
- Side-by-side comparison: `.design-qa/camera-angle-persistence-comparison.png`
- Viewport: 1295 x 783 CSS pixels in the user's Chrome session, desktop light theme
- State: KnackSat-2 selected, initial focus complete, camera manually orbited to a custom angle

## Findings

- No actionable P0, P1, or P2 issue remains for the requested camera interaction.
- The previous repeat-focus counter has been removed. Only changing from one satellite to another starts the smooth focus animation.
- Clicking the already-selected KnackSat list row leaves the manually chosen camera angle unchanged.
- Clicking the active KnackSat GLB also leaves the camera angle unchanged.
- The selected satellite remains followed as its SGP4 position updates, using a stored camera-to-target offset. This prevents follow updates from rebuilding a default viewing direction.
- Drag/touch OrbitControls remain available after focus and automatic model rotation remains disabled.

## Comparison evidence

- `.design-qa/camera-angle-persistence-comparison.png` shows three consecutive states: custom angle before repeat click, after clicking the same list row, and after clicking the GLB. Model face, silhouette, scale, orbit-line intersection, and Earth background framing remain visually identical.
- No focused crop is necessary because the complete satellite silhouette and surrounding camera framing are clearly readable in the full-view comparison.
- Fonts, layout, colors, GLB asset, copy, and panel behavior are unchanged.

## Comparison history

1. **P1 — repeat selection reset the camera angle.** Cause: every selection incremented `satelliteFocusRequest`, including selection of the already-active satellite. Fix: remove the repeat-focus request and focus only when `activeNoradId` actually changes. Evidence: middle panel of `.design-qa/camera-angle-persistence-comparison.png`.
2. **P1 — clicking the active GLB could trigger the same reset.** Cause: the model and list shared the same repeat-focus handler. Fix: selecting the same NORAD ID is now an interaction no-op for camera focus. Evidence: right panel of the comparison.
3. **P2 — live following could gradually rebuild the view direction.** Fix: store the user-controlled camera offset and apply it relative to the satellite's current SGP4 position.

## Primary interactions tested

- Select KnackSat-2 and wait for initial smooth focus and GLB load.
- Drag the camera to a custom view and allow the interaction to settle.
- Click the selected KnackSat-2 list row and wait longer than the former 1.8 second focus animation.
- Click the visible KnackSat GLB and wait again.
- Compare all three camera states side by side.
- Reload the final page and check new browser console errors: none.

## Verification

- [x] Initial selection still focuses the satellite
- [x] Different-satellite selection can still start a new focus
- [x] Repeat list click does not refocus
- [x] Active GLB click does not refocus
- [x] Manual camera angle remains free and persistent
- [x] Targeted ESLint and production build pass
- [x] Final browser reload has zero new console errors

final result: passed
