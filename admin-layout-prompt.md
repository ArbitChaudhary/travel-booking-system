# Admin Layout Generation Prompt

Use the prompt below to generate an admin layout with Tailwind CSS and shadcn/ui.

## Prompt

Create a modern admin layout using Next.js, Tailwind CSS, and shadcn/ui.

Requirements:

- Build a reusable `AdminLayout` component.
- The layout must have a left sidebar and a main content area.
- The main content area must render `children`.
- The sidebar must stay on the left side of the screen.
- Add a logo section at the top of the sidebar.
- The sidebar should support grouped items, collapsible items, and normal navigation items.
- Use `lucide-react` icons for menu items.
- Keep the UI clean, responsive, and suitable for an admin dashboard.
- Use Tailwind CSS for layout and styling.
- Use shadcn/ui components where appropriate.

Define the sidebar data structure like this:

```ts
import { LucideIcon } from "lucide-react";

interface ISidebar {
  label: string;
  href?: string;
  icon?: LucideIcon;
  type: "GROUP" | "COLLAPSE" | "ITEM";
  children?: ISidebar[];
}
```

Implementation expectations:

- Create a sidebar component that renders items based on the `ISidebar` config.
- `GROUP` should render a titled section.
- `COLLAPSE` should render a collapsible menu that can show nested `children`.
- `ITEM` should render a clickable navigation link.
- Highlight the active route.
- Keep spacing, typography, and hover states consistent.
- The layout should work well on desktop and adapt reasonably on smaller screens.

Suggested output:

- `AdminLayout` component
- `AdminSidebar` component
- sample sidebar config
- example usage with page content passed as `children`

Return complete production-ready code.
