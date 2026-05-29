# Contributing to @poliglot-io/uikit

Thanks for your interest in contributing.

## Development

Requires Node.js 22+.

```bash
npm install
npm run build      # tsc + bundled CSS
npm run dev        # tsc --watch
npm test           # vitest
npm run lint
```

`npm install` also installs a pre-commit hook (via [husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged)) that runs `eslint --fix` on staged TypeScript/JavaScript files before each commit.

## Reporting bugs

Open an issue with the **Bug report** template. Include the minimal reproduction, the version you're on, and what you expected vs. what happened.

## Proposing changes

For anything beyond a small fix:

1. Open an issue first with the **Feature request** template so we can agree on scope.
2. Fork, branch from `main`, and make your change.
3. Run `npm run lint` and `npm test` locally — CI will run the same checks.
4. Open a PR against `main`. Fill out the PR template.

## Coding standards

- TypeScript strict mode; no `any` without a comment explaining why.
- React components live in `src/components/`. One component per file. Match the existing shadcn/Radix patterns.
- ESLint + Prettier defaults are enforced in CI (`npm run lint`).
- Tests use Vitest. Co-locate test files as `*.test.ts` next to source.

## Releasing

Releases publish to npm as `@poliglot-io/uikit`. Maintainers cut a release via a git tag (`v*`); the publish workflow handles npm authentication. Do not publish from a local machine.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## Contributor License Agreement

Before your first PR can be merged you'll need to sign the Poliglot CLA:

- Individual: <https://poliglot.io/cla/individual>
- Overview: <https://poliglot.io/cla>

The CLA is a one-time sign — it covers all current and future Poliglot OSS repos. Our CLA bot will leave a comment on your first PR with the signing link.

## License

By contributing you agree that your contributions will be licensed under the Apache License 2.0.

