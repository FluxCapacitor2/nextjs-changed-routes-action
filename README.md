# Next.js Changed Pages Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)

This GitHub action takes a list of changed files, traces their dependencies, and
creates a list of affected pages. This can then be used to generate visual
diffs, compare Lighthouse scores, or run tests on changed pages.

It does this by reading Next.js's route manifest at
`.next/app-path-routes-manifest.json`. The dependencies of each route are traced
using `@vercel/nft`, with intermediate TypeScript compilation done with
`esbuild`.

## Compatibility

- This action has been tested with Next.js 14 and the `app` directory. It may
  also work with Next.js 13.
- Both JavaScript and TypeScript pages are supported.
- **This project does not support the `pages` directory.**

## Inputs

- `includedPaths`: A list of globs to include in file tracing, separated by
  newlines. These globs should only match application code, like your `app/`
  directory and an additional `components` directory. Using more specific globs
  will increase performance and reduce the number of files that need to be
  traced.
- `separator`: A separator to delimit the remaining inputs. Defaults to a comma
  (`,`).
- `changedFiles`: A list of files that were changed as a result of the current
  commit or pull request. This input should be separated by the specified
  `separator`.
- `appRoot`: The directory that contains all of your routes. Typically `app/` or
  `src/app/`. Defaults to `app/`.

## Outputs

- `changedRoutes`: A list of routes that were affected by the commit or pull
  request's file changes. This output is separated by the specified `separator`
  input.

## Example Workflow

```yml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Build
        # Build Next.js without pregenerating static pages
        run: npx next experimental-compile
      - name: Find changed files
        id: changed-files
        uses: tj-actions/changed-files@v43
        with:
          separator: ","
      - name: Identify changed routes
        id: changed-routes
        uses: FluxCapacitor2/nextjs-changed-routes-action@main
        with:
          includedPaths: |
            src/**
            app/**
            components/**
          changedFiles: ${{ steps.changed-files.outputs.all_modified_files }}
      - name: Output changed routes
        run: echo "${{ steps.changed-routes.outputs.changedRoutes }}
```
