# Orbit design

A dark interface that sits on top of the content. Panels are square and frosted. Controls are pills. Type is small, quiet, and tracked in Latin. Use this as the visual reference for other Spaceth sites.

The page is dark only. There is no light theme.

## Color

Black is the ground. White is reserved for the thing you are reading or the thing that is selected. Gray is everything else.

| Token | Value | Use |
| --- | --- | --- |
| Background | `#000000` | Page, canvas, theme color |
| Foreground | `#f5f5f7` | Body text, selected control, values |
| Muted | `#a1a1a6` | Labels, secondary text, idle controls |
| Panel heading | `#f5f5f7` | Open section titles |
| Error | `#ff453a` | Failures only |
| Edge | `rgba(255, 255, 255, 0.16)` | Panel and pill borders |
| Border, quieter | `rgba(255, 255, 255, 0.12)` | Hairlines inside a panel |
| Active wash | `rgba(255, 255, 255, 0.10)` | Selected row, pressed sort chip |
| Hover wash | `rgba(255, 255, 255, 0.05)` | Hovered row |
| Skeleton | `rgba(255, 255, 255, 0.06)` | Loading blocks |
| Material | `#000000b8` | Frosted panel, chip, and sheet fill |

Do not introduce a second accent color. Selection is a white wash or full foreground text, not a colored badge.

## Typography

Two families, one stack.

```css
font-family: var(--font-poppins), "aktiv-grotesk-thai", sans-serif;
```

- **Poppins** for Latin. Load weights 400, 500, and 600. `display: swap`. Optical sizing on.
- **Aktiv Grotesk Thai** for Thai, from the Adobe Fonts kit `ayj4ilb` (`https://use.typekit.net/ayj4ilb.css`). It follows Poppins in the stack, so Thai glyphs fall through to it.
- Turn on antialiasing on the root.

Line height for body copy is **1.45**.

| Role | Size | Weight | Tracking | Case |
| --- | --- | --- | --- | --- |
| Page title | `1.5rem` (`text-2xl`) | 600 | tight | As written |
| Row name | `0.875rem` (`text-sm`) | 500 | normal | As written |
| Row meta, values | `0.75rem` (`text-xs`) | 400 or 500 | normal | As written |
| Clock chip | `11px` | 400 | normal | As written |
| Section label | `0.75rem` or `10px` | 500 | `0.14em` | Uppercase |
| Pill control | `10px`, `text-xs` from `640px` | 500 | `0.12em` | Uppercase |
| Footer | `10px`, `9px` on a phone | 400 | `0.14em` | Uppercase on desktop |

Numbers that change — time, coordinates, altitude, speed, NORAD IDs — use `tabular-nums` so the width stays still.

**Thai turns tracking off.** On `html[lang="th"]`, set `letter-spacing: normal` on every element. Uppercase Latin tracking looks wrong on Thai.

Keep headings short. A satellite name is the only large type on the page.

## Surfaces

Chrome floats over the page. It does not fill it.

A panel, chip, or sheet is:

- Fill `#000000b8`
- `backdrop-filter: blur(20px) saturate(140%)`
- `1px` edge in the edge color
- **Square corners** (`border-radius: 0`)
- Shadow `0 12px 32px rgba(0, 0, 0, 0.32)`

Inset from the viewport is **20px** (`top-5`, `left-5`, `right-5`). Panel padding is **20px**. The wordmark sits in a 56px-tall band, centered, and is 18px tall on desktop, 14.4px on a phone.

On a phone the main panel becomes a bottom sheet: a top hairline, no blur on the inner glass, and a safe-area strip in the material color. The sheet is about 35% of the screen until the reader opens a detail, then about 70%.

If the user asks for less transparency, drop the blur and use solid black. If they ask for more contrast, use solid black and a foreground border.

Rows inside a panel are the exception to square corners: a selected or hovered row uses `rounded-xl` and the active or hover wash. The panel itself stays square.

## Buttons

Two shapes. Do not mix them.

### Pill

`.round-control` is the only button shape.

- `1px` edge, `border-radius: 999px`
- Padding about `8px` horizontal and `2px` vertical (`px-2 py-0.5`). A slightly larger chip uses `px-2.5 py-1`.
- Idle: muted text at about 60% opacity
- Selected: foreground text at full opacity. A sort chip also gets the active wash and weight 500
- Hover: full opacity, or foreground text
- Disabled: 30% opacity, default cursor

Language, view mode, sort, hide, and now all use this pill.

### Text button

Section headers are not pills. They are a full-width row: weight 500, uppercase, tracking `0.14em`, with a chevron. The open group uses foreground. A closed group uses muted and lightens on hover.

List rows are text buttons too: name at weight 500 on the left, a quiet label on the right, `8px` horizontal padding, `4px` vertical. No border.

### Press

Every `button` drops to **72% opacity** on press, in 80ms. Add `.pressable` when the control should also scale to **0.97**. Remove the tap highlight.

```css
button {
  -webkit-tap-highlight-color: transparent;
}
button:active:not(:disabled) {
  opacity: 0.72;
}
.pressable:active:not(:disabled) {
  transform: scale(0.97);
}
```

Links in the chrome fade toward foreground on hover (`opacity` about 0.8, 300ms on the wordmark).

## Icons

Draw icons yourself. One weight, no fills.

- `14×14` px on screen, `24×24` view box
- Stroke `currentColor`, width **1.5**
- Round caps on a slash
- No second color. A hidden state drops the eye to 35% opacity and adds a slash
- A chevron is `14×14`, stroke width **2**, and rotates **90°** in 200ms when the section opens. It points right when closed and down when open
- `aria-hidden` on the graphic. The button carries the name

## Fields

A text field is a square box on a transparent fill.

- `1px` edge
- `8px` horizontal padding, `4px` vertical
- `0.75rem` type, foreground
- No outline on focus beyond the existing edge. A keyboard control such as the timeline uses a 1px foreground outline, offset 4px
- The label sits above it: `10px`, uppercase, tracking `0.12em`, muted

A copyable ID is dotted underline, offset 3px, `cursor: copy`, and turns foreground on hover.

## Motion

Motion explains a change of state. It does not decorate.

| What | Duration | Curve |
| --- | --- | --- |
| Press opacity | 80ms | `ease-out` |
| Press scale | 100ms | `ease-out` |
| Chevron | 200ms | default transform |
| Color hover | default | `transition-colors` |
| Panel, chip, or sheet opening | 320ms | `cubic-bezier(0.2, 0, 0, 1)` on opacity, transform, and filter |
| Thumb, when not dragging | 320ms | same curve, on position and width |
| Phone sheet height | 350ms | same curve |

A closed chip or sheet scales to about **0.95–0.96**, fades out, and may blur by 8px. Its transform origin is the corner it grows from: top-right for a menu, bottom-center for the timeline.

While the user is dragging, turn the thumb transition off.

`prefers-reduced-motion` keeps a 200ms opacity fade and removes transform and filter. `prefers-reduced-transparency` removes the blur.

## Layout habits

- One panel on the left, controls on the right, the wordmark centered, the clock at the bottom center.
- Gaps inside a control group are 4px. Gaps between groups are 8–12px.
- Do not cover the middle of the view with chrome unless the user opened that panel.
- On a phone, stack the sheet at the bottom and let the clock sit above it.

## Using this on another site

Copy the color tokens, the type stack, the square material, and the pill. Keep selection as a white wash. Keep labels at 10px uppercase, and turn that tracking off for Thai.
