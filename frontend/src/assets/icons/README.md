# Nexus Icon Set

79 unique line icons extracted from the Nexus design system, covering the full 24x24
icon system used across the live app. Every icon is
a self-contained SVG that inherits its color from CSS `currentColor`, so a single
file works in light and dark themes and at any size.

## Files

- `*.svg`: one file per unique icon, named by its icon identity (`search.svg`,
  `trash-2.svg`, `chevrons-up-down.svg`, ...).
- `manifest.json`: array of `{ file, viewBox, usedCount }`, sorted by `usedCount`
  (how many times the icon appears in the source design), most-used first.

## How these were extracted

Source: `figma-export-tool/nexus-figma.json` (all nodes with `role === "svg"`).

1. **Filtered to the icon system.** Only `viewBox="0 0 24 24"` nodes are kept. The
   81 non-icon SVGs in the export (sparklines, donut/area charts, radial gauges, axis
   grids, QR placeholders, all with larger viewBoxes) are data-viz and not reusable
   icons, and were excluded.
2. **Deduped by shape, not by bytes.** The raw export has 615 byte-distinct icon
   markups, but most differences are only stroke color (`rgb(20,20,20)` vs
   `rgb(92,92,92)`) or pixel size. Normalizing color/size/stroke-width collapses those
   recolored copies into **79 genuinely unique shapes**. Each is re-emitted with
   `stroke="currentColor"` and `stroke-width="2"` so it is themeable. `usedCount`
   sums every occurrence across all color variants.
3. **Named by authoritative geometry match.** The icons are Feather/Lucide line
   icons. Each shape's geometry signature is matched against the real
   [Feather Icons](https://feathericons.com) set (42 matched) and a curated
   Lucide-geometry map for the Lucide-only glyphs (36 matched: `chevrons-up-down`,
   `trash-2`, `sparkles`, social logos, etc.). Names are the canonical icon names, not
   guesses from nearby button text. 1 low-frequency glyph could not be identified and
   is named `icon-1`. Distinct shapes that share a semantic name (two star styles,
   three envelope styles) are suffixed `-2`, `-3`.

Regenerate with `extract-icons.js` (in this folder). It needs the `feather-icons`
package for name matching: `npm i feather-icons`, then `node extract-icons.js`. It
reads the Figma export and rewrites every `*.svg` plus `manifest.json`.

## Usage

Inline (recolors and scales with the surrounding text; preferred):

```html
<span class="icon">
  <!-- paste the contents of search.svg here, or load via a build step -->
</span>
```

```css
.icon svg { width: 1em; height: 1em; color: var(--ink); }
```

As an image (color is fixed to whatever the file carries, i.e. `currentColor`
resolves to black, so use inline SVG when you need theming):

```html
<img src="assets/icons/search.svg" width="20" height="20" alt="Search" />
```

CSS mask (recolorable `<img>`-style without inlining):

```css
.icon-search {
  width: 20px; height: 20px;
  background: currentColor;
  -webkit-mask: url("assets/icons/search.svg") center / contain no-repeat;
          mask: url("assets/icons/search.svg") center / contain no-repeat;
}
```

Decorative icons should carry `aria-hidden="true"`; icons that convey meaning on
their own need an accessible label (`aria-label` on the SVG or adjacent visible
text).
