# Website Colour Palette

This palette defines the earthy, warm bronze to olive green aesthetic to be used across the entire website.

---

## 🎨 Palette Swatches & Hex Codes

| # | Preview | Hex Code | Color Name | Suggested Role in Design |
|---|:---:|---|---|---|
| **1** | ![#582f0e](https://via.placeholder.com/24/582f0e/582f0e.png) | `#582f0e` | Deep Espresso Brown | Primary dark surfaces, dark accents, footer accents, deep contrast headers |
| **2** | ![#7f4f24](https://via.placeholder.com/24/7f4f24/7f4f24.png) | `#7f4f24` | Warm Russet Umber | Primary buttons, active tabs, prominent CTAs, hero accents |
| **3** | ![#936639](https://via.placeholder.com/24/936639/936639.png) | `#936639` | Golden Caramel Bronze | Secondary buttons, link highlights, interactive hover states |
| **4** | ![#a68a64](https://via.placeholder.com/24/a68a64/a68a64.png) | `#a68a64` | Warm Khaki Tan | Card borders, subtle divider lines, secondary badges |
| **5** | ![#b6ad90](https://via.placeholder.com/24/b6ad90/b6ad90.png) | `#b6ad90` | Light Sandstone / Ecru | Muted pill backgrounds, input outlines, table headers |
| **6** | ![#c2c5aa](https://via.placeholder.com/24/c2c5aa/c2c5aa.png) | `#c2c5aa` | Sage Mist / Bone | Light card surface backgrounds, subtle hover tints, badges |
| **7** | ![#a4ac86](https://via.placeholder.com/24/a4ac86/a4ac86.png) | `#a4ac86` | Soft Herb Sage | Success badges, verified tags, completed status indicators |
| **8** | ![#656d4a](https://via.placeholder.com/24/656d4a/656d4a.png) | `#656d4a` | Muted Olive Green | Secondary action buttons, tag chips, progress bar fills |
| **9** | ![#414833](https://via.placeholder.com/24/414833/414833.png) | `#414833` | Deep Olive Charcoal | Dark mode card containers, sidebar borders, navigation surfaces |
| **10** | ![#333d29](https://via.placeholder.com/24/333d29/333d29.png) | `#333d29` | Dark Moss Forest | Deepest background base, dark mode canvas, high-contrast text |

*(Note: Swatch #5 represents `#b6ad90` which bridges the `#a68a64` warm tan and `#c2c5aa` sage mist in this 10-step earthy spectrum).*

---

## 📋 Raw Hex List

```text
582f0e
7f4f24
936639
a68a64
b6ad90
c2c5aa
a4ac86
656d4a
414833
333d29
```

---

## 💻 CSS Variables Ready-to-Use (`:root`)

```css
:root {
  /* Warm Earthy Palette */
  --earth-espresso: #582f0e;
  --earth-umber:    #7f4f24;
  --earth-caramel:  #936639;
  --earth-khaki:    #a68a64;
  --earth-sand:     #b6ad90;
  --earth-bone:     #c2c5aa;
  --earth-sage:     #a4ac86;
  --earth-olive:    #656d4a;
  --earth-deep-olive: #414833;
  --earth-moss:     #333d29;

  /* Semantic Application */
  --color-primary: var(--earth-umber);           /* #7f4f24 */
  --color-primary-hover: var(--earth-caramel);    /* #936639 */
  --color-accent: var(--earth-sage);              /* #a4ac86 */
  --color-bg-dark: var(--earth-moss);             /* #333d29 */
  --color-surface-dark: var(--earth-deep-olive);  /* #414833 */
  --color-border: var(--earth-khaki);             /* #a68a64 */
  --color-muted-bg: var(--earth-bone);            /* #c2c5aa */
}
```

---

## 📐 Suggested UI Component Usage

1. **Buttons & CTAs**:
   - Primary: Gradient from `#7f4f24` (Umber) to `#936639` (Caramel) with light text (`#c2c5aa`).
   - Secondary: Transparent with `#a68a64` (Khaki) border and hover `#656d4a` (Olive).
2. **Badges & Pills**:
   - Success / Verified: `#a4ac86` (Soft Herb Sage) with `#333d29` (Dark Moss) text.
   - Neutral / Informational: `#c2c5aa` (Sage Mist) or `#b6ad90` (Light Sandstone).
3. **Cards & Containers**:
   - Dark Theme: `#414833` (Deep Olive Charcoal) and `#333d29` (Dark Moss Forest) with `#a68a64`/20 borders.
   - Light Theme: `#c2c5aa` (Bone) or frosted glass tint with `#582f0e` text.
4. **Header & Navigation**:
   - Deep contrast background using `#333d29` and `#582f0e` subtle mesh gradient.
