# Enterprise Website Colour Palette

This palette defines the ultra-professional, tier-1 enterprise SaaS aesthetic (Slate Obsidian & Royal Tech Sapphire) used across the platform.

---

## 🎨 Palette Swatches & Hex Codes

| # | Preview | Hex Code | Color Name | Suggested Role in Design |
|---|:---:|---|---|---|
| **1** | ![#090d16](https://via.placeholder.com/24/090d16/090d16.png) | `#090d16` | Obsidian Slate | Deepest background canvas, dark contrast headers, executive footers |
| **2** | ![#0f172a](https://via.placeholder.com/24/0f172a/0f172a.png) | `#0f172a` | Midnight Navy / Slate 900 | High-contrast typography, dark navigation surfaces, hero titles |
| **3** | ![#1e293b](https://via.placeholder.com/24/1e293b/1e293b.png) | `#1e293b` | Dark Slate 800 | Elevated dark cards, primary container borders, high-emphasis text |
| **4** | ![#2563eb](https://via.placeholder.com/24/2563eb/2563eb.png) | `#2563eb` | Royal Tech Sapphire | Primary brand accent, primary CTA buttons, active sidebar bar |
| **5** | ![#1d4ed8](https://via.placeholder.com/24/1d4ed8/1d4ed8.png) | `#1d4ed8` | Deep Sapphire 700 | Primary button hover/active, focused state borders, high-contrast link highlights |
| **6** | ![#4f46e5](https://via.placeholder.com/24/4f46e5/4f46e5.png) | `#4f46e5` | Tech Indigo | Secondary brand accent, gradient mesh stops, feature card highlights |
| **7** | ![#10b981](https://via.placeholder.com/24/10b981/10b981.png) | `#10b981` | Emerald Success | Operational status indicators, SLA guarantees, verified badges |
| **8** | ![#f59e0b](https://via.placeholder.com/24/f59e0b/f59e0b.png) | `#f59e0b` | Vivid Amber | Warning directives, impending expirations, triage attention alerts |
| **9** | ![#ef4444](https://via.placeholder.com/24/ef4444/ef4444.png) | `#ef4444` | Crimson Urgent | Critical alerts, security triggers, SLA breach warnings |
| **10** | ![#8b5cf6](https://via.placeholder.com/24/8b5cf6/8b5cf6.png) | `#8b5cf6` | Electric Violet | Accreditation tags, certified credentials, advanced curricula |
| **11** | ![#64748b](https://via.placeholder.com/24/64748b/64748b.png) | `#64748b` | Cool Slate 500 | Secondary body text, table metadata, muted subtitles |
| **12** | ![#94a3b8](https://via.placeholder.com/24/94a3b8/94a3b8.png) | `#94a3b8` | Slate Mist 400 | Subtle icons, placeholder text, tertiary meta labels |
| **13** | ![#e2e8f0](https://via.placeholder.com/24/e2e8f0/e2e8f0.png) | `#e2e8f0` | Crisp Border 200 | Clean hairline card borders, table dividers, control outlines |
| **14** | ![#f1f5f9](https://via.placeholder.com/24/f1f5f9/f1f5f9.png) | `#f1f5f9` | Slate Mist 100 | Inset wells, striped table rows, subtle pill hover backgrounds |
| **15** | ![#eff6ff](https://via.placeholder.com/24/eff6ff/eff6ff.png) | `#eff6ff` | Sapphire Wash 50 | Active navigation item background, info chip backgrounds |
| **16** | ![#f8fafc](https://via.placeholder.com/24/f8fafc/f8fafc.png) | `#f8fafc` | Slate Canvas 50 | Clean app page background, canvas contrast layer |
| **17** | ![#ffffff](https://via.placeholder.com/24/ffffff/ffffff.png) | `#ffffff` | Pure White | Elevated card surfaces, modal containers, crisp contrast base |

---

## 📋 Raw Hex List

```text
090d16
0f172a
1e293b
2563eb
1d4ed8
4f46e5
10b981
f59e0b
ef4444
8b5cf6
64748b
94a3b8
e2e8f0
f1f5f9
eff6ff
f8fafc
ffffff
```

---

## 💻 CSS Variables Ready-to-Use (`:root`)

```css
:root {
  /* Core Obsidian & Sapphire Scale */
  --slate-obsidian:   #090d16;
  --slate-900:        #0f172a;
  --slate-800:        #1e293b;
  --slate-700:        #334155;
  --slate-600:        #475569;
  --slate-500:        #64748b;
  --slate-400:        #94a3b8;
  --slate-300:        #cbd5e1;
  --slate-200:        #e2e8f0;
  --slate-100:        #f1f5f9;
  --slate-50:         #f8fafc;
  --white:            #ffffff;

  /* Primary Brand Sapphire */
  --sapphire-600:     #2563eb;
  --sapphire-700:     #1d4ed8;
  --sapphire-500:     #3b82f6;
  --sapphire-100:     #dbeafe;
  --sapphire-50:      #eff6ff;

  /* Tech Indigo Secondary */
  --indigo-600:       #4f46e5;
  --indigo-500:       #6366f1;
  --indigo-50:        #eef2ff;

  /* Status Tokens */
  --emerald-500:      #10b981;
  --emerald-50:       #ecfdf5;
  --amber-500:        #f59e0b;
  --amber-50:         #fffbeb;
  --rose-500:         #ef4444;
  --rose-50:          #fef2f2;
  --violet-500:       #8b5cf6;
  --violet-50:        #f5f3ff;

  /* Semantic UI Application */
  --color-primary:       var(--sapphire-600);
  --color-primary-hover: var(--sapphire-700);
  --color-accent:        var(--indigo-600);
  --color-bg-dark:       var(--slate-900);
  --color-surface-dark:  var(--slate-800);
  --color-border:        var(--slate-200);
  --color-muted-bg:      var(--slate-50);

  /* Sidebar Tokens */
  --sidebar-hover-bg:    var(--slate-100);
  --sidebar-active-bg:   var(--sapphire-50);
  --sidebar-active-text: var(--sapphire-700);
  --sidebar-active-bar:  var(--sapphire-600);
}
```

---

## 📐 Enterprise UI Component Guidelines

1. **Buttons & Interactive CTAs**:
   - **Primary Action**: Solid `#2563eb` (Tech Sapphire) with hover `#1d4ed8`, crisp white text, and subtle `#2563eb26` drop shadow.
   - **Secondary / Ghost**: White background `#ffffff` with `#e2e8f0` border, `#334155` text, and hover `#f8fafc`.
   - **Destructive**: `#ef4444` with `#fef2f2` wash or solid `#dc2626`.

2. **Cards & Containers**:
   - Elevated cards on `#ffffff` with `#e2e8f0` crisp hairline border (or subtle `#0f172a0a` drop shadow).
   - Card headers with clear title `#0f172a` and subtitle in `#64748b`.
   - Inner metric wells on `#f8fafc` or `#f1f5f9`.

3. **Status Badges & Chips**:
   - **Success / Operational**: `#ecfdf5` background, `#059669` text, `#a7f3d0` border.
   - **Warning / Action Needed**: `#fffbeb` background, `#d97706` text, `#fde68a` border.
   - **Urgent / Critical**: `#fef2f2` background, `#dc2626` text, `#fecaca` border.
   - **Accreditation / Honors**: `#f5f3ff` background, `#7c3aed` text, `#ddd6fe` border.
   - **Neutral / Meta**: `#f1f5f9` background, `#475569` text, `#e2e8f0` border.

4. **Navigation & Active States**:
   - Sidebar item default: `#475569` with hover `#f1f5f9`.
   - Sidebar item active: `#eff6ff` light sapphire wash with `#1d4ed8` bold text and `#2563eb` solid left indicator bar.
