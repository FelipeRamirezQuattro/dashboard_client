# Library gaps

Components or behaviors the screens needed that `@odessa-separator/ui` does not provide, and the workaround used.

| Screen | Need | Workaround |
| --- | --- | --- |
| HierarchicalSidebar (business unit > department > app tree) | Expandable/nested sidebar item (tree with `aria-expanded`, indentation, child group). `SidebarItem` owns its `<li><a>` so it cannot contain a nested `<ul>`, and has no expand state. | Flat `SidebarItem`s indented with `ml-*` per level; BU and department rows are `href="#"` + `role="button"` + `aria-expanded` toggling local state (Space key does not activate an `<a role="button">`). |
| MobileNav categories (unused `showCategories` feature) | Sidebar item that acts as a button (not a link). | `SidebarItem href="#" role="button" aria-pressed`, click handler calls `preventDefault`. |
| Sidebar / MobileNav / HierarchicalSidebar section titles | `SidebarNav` wraps children in a `<ul>`, but `SidebarSectionLabel` renders a `<p>`, so the library's own API produces invalid HTML (`<p>` as a child of `<ul>`). | Used `SidebarSectionLabel` as documented inside `SidebarNav`; no wrapper added (a `<li>` wrapper would not help keep the library styling contract). Needs a library fix (render `<li role="presentation">` or allow it outside the `<ul>`). |
| Shared SkeletonLoader (avatar/icon placeholders) | Circular skeleton shape; `rounded-full` is forbidden by the guard and `Skeleton` has no `shape` prop. | Circular placeholders render with the library Skeleton corner radius (square-ish). `animation` prop is ignored; the library owns it. |
