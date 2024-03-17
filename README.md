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

This action has been tested with Next.js 14 and the `app` directory. It may work
with Next.js 13.

JavaScript and TypeScript pages are supported, but MDX is not.

**This project does not support the `pages` directory.**

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
