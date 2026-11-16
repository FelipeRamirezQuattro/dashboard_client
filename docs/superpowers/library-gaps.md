# Library gaps

Components or behaviors the screens needed that `@odessa-separator/ui` does not provide, and the workaround used.

| Screen | Need | Workaround |
| --- | --- | --- |
| HierarchicalSidebar (business unit > department > app tree) | Expandable/nested sidebar item (tree with `aria-expanded`, indentation, child group). `SidebarItem` owns its `<li><a>` so it cannot contain a nested `<ul>`, and has no expand state. | Flat `SidebarItem`s indented with `ml-*` per level; BU and department rows are `href="#"` + `role="button"` + `aria-expanded` toggling local state (Space key does not activate an `<a role="button">`). |
| MobileNav categories (unused `showCategories` feature) | Sidebar item that acts as a button (not a link). | `SidebarItem href="#" role="button" aria-pressed`, click handler calls `preventDefault`. |
