# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-beta.19]

### Changed

- **Build:** test/story fixtures now live in `src/components/__fixtures__/`
  instead of sitting loose beside components. They are excluded from the
  published `dist` output, and the component-surface generator skips
  `*.fixtures.*` files so they no longer leak into `surface/components.json`.

## [0.1.0-beta.18]

### Fixed

- **NetworkGraph:** multiple relationships between the same two nodes now
  render as separate arcs instead of overlapping on a single line, and each
  edge label sits on its own curve. Self-loops are now visible.

## [0.1.0-beta.1] — beta

Initial release. The Poliglot platform is in private beta; the API surface
may change before 1.0.

[Unreleased]: https://github.com/poliglot-io/uikit/compare/v0.1.0-beta.19...HEAD
[0.1.0-beta.19]: https://github.com/poliglot-io/uikit/compare/v0.1.0-beta.18...v0.1.0-beta.19
[0.1.0-beta.18]: https://github.com/poliglot-io/uikit/compare/v0.1.0-beta.1...v0.1.0-beta.18
[0.1.0-beta.1]: https://github.com/poliglot-io/uikit/releases/tag/v0.1.0-beta.1
