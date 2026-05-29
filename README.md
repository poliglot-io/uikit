# @poliglot-io/uikit

React component library and build tooling for [Poliglot](https://poliglot.io), a semantic operating system that turns the things you do and the way you work into an executable program.

`uikit` ships two things:

- **Component primitives** (Button, Card, Dialog, Form, Table, etc.) used by Poliglot applications. Built on Radix UI + Tailwind and compatible with React Server Components.
- **`poliglot-ui`**, the CLI binary that the [`plgt`](https://github.com/poliglot-io/plgt-cli) authoring tool invokes to assemble the UI surface declared by a Poliglot matrix.

Status: **alpha**. Poliglot is in private beta; APIs and exports may change before 1.0.

## Installation

```bash
npm install @poliglot-io/uikit
```

### Peer Dependencies

- `react` >= 19.0.0
- `react-dom` >= 19.0.0
- `next-themes` >= 0.4.0 (optional, for theme support)

## Usage

```tsx
import { Button } from "@poliglot-io/uikit/components/button";
import { Card } from "@poliglot-io/uikit/components/card";
import "@poliglot-io/uikit/styles.min.css";
```

## Components

Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Empty, Form, Hover Card, Input, Input OTP, Label, Menubar, Mermaid, Navigation Menu, Network Graph, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Spinner, Sonner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Tooltip.

## Development

```bash
npm install
npm run build      # tsc + bundled CSS
npm run dev        # tsc --watch
npm test           # vitest
npm run lint
```

## Documentation

- Conceptual overview: <https://poliglot.io/docs/arch/ui-components>
- Full docs: <https://poliglot.io/docs>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributors must sign the [Poliglot Contributor License Agreement](https://poliglot.io/cla) before their first PR is merged.

Bugs and feature requests go through GitHub Issues; security issues use [private security advisories](https://github.com/poliglot-io/uikit/security/advisories/new) — see [SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE) · © Poliglot Inc.
