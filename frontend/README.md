# Nexus Frontend Design System

This project contains the complete, pixel-perfect translation of the Nexus Frontend Handoff Kit into a scalable **Tailwind CSS + React (CVA)** architecture. 

We follow a strict pipeline: **Design System → Design Tokens → Tailwind Config → UI Primitives → Pages**.

## Architecture & Setup

### 1. Design Tokens (`src/styles/tokens.css`)
All canonical design variables from the handoff kit are stored as CSS custom properties here. This includes the exact hex values for our core palette (Honey, Sage, Clay, Danger), our spacing ladder, and our typography scale. 

**Rule:** Do not hardcode pixel values or hex codes in components. Always use the tokens.

### 2. Tailwind Configuration (`tailwind.config.js`)
Our `tailwind.config.js` directly maps the CSS variables into Tailwind classes. You can use these everywhere:

- **Colors:** `bg-honey`, `text-ink-mute`, `bg-sage-wash`, `border-danger`, `bg-paper-2`
- **Typography:** `text-h1`, `text-body`, `text-meta`
- **Spacing:** `p-4`, `gap-6`, `my-11` (maps precisely to the `var(--space-*)` ladder)
- **Radii:** `rounded-xs` (8px), `rounded-md` (10px), `rounded-pill`
- **Shadows:** `shadow-sm`, `shadow-card`, `shadow-hover`

### 3. Component Utilities (`src/lib/cn.ts`)
We use `clsx` and `tailwind-merge` to safely construct and merge dynamic Tailwind classes. When building or extending components, always wrap `className` props in `cn()` to avoid Tailwind specificity conflicts.

## UI Component Library

All primitive components live in `src/components/ui/` and `src/components/layout/`. They are strictly typed and map exactly to the Handoff Kit specifications using `class-variance-authority` (CVA).

### Buttons
Supports all strict variants and sizes from the handoff kit.
```tsx
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="md">Save Changes</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger">Delete</Button>
```

### Cards
The backbone of all content sections.
```tsx
import { Card } from "@/components/ui/Card";

<Card variant="default">
  <p>Standard elevated card</p>
</Card>

<Card variant="flat">
  <p>Borderless/flat card</p>
</Card>
```

### Forms
Wrap inputs in the `Field` component for automatic label and ID generation.
```tsx
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

<Field label="Email Address" required>
  <Input variant="md" type="email" placeholder="john@example.com" />
</Field>
```

### Badges / Chips
Use chips for status indicators and metadata.
```tsx
import { Chip } from "@/components/ui/Chip";

<Chip status="success">Completed</Chip>
<Chip status="warning">Due Soon</Chip>
<Chip status="info">Admin</Chip>
```

### Avatars
Scalable avatars with exact sizes and tint overlays.
```tsx
import { Avatar } from "@/components/ui/Avatar";

<Avatar size={34} hue="sage" initials="JD" />
<Avatar size={46} topbar src="/user.jpg" />
```

## Layout Shell

The global layout is managed by the `AppShell`, which automatically orchestrates the `Sidebar` and `Topbar`.

```tsx
import { AppShell } from "@/components/layout/AppShell";

const navData = [
  {
    title: "Learning",
    items: [
      { label: "Dashboard", href: "/dashboard", active: true },
      { label: "Courses", href: "/courses", count: 8 }
    ]
  }
];

export default function Layout({ children }) {
  return (
    <AppShell nav={navData} persona="Learner">
      {children}
    </AppShell>
  );
}
```

## Developer Workflow
To run the development server locally:
```bash
npm run dev
```

*For more in-depth guidelines on accessibility, responsive scaling, and state management, please refer to the original `docs/` folder.*
