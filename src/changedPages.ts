import core from "@actions/core";
import { readFile } from "fs/promises";
import { trace } from "./nft";

/**
 * Returns a list of routes affected by the changes in the given list of files.
 * Uses Next.js's output file tracing to find all affected pages.
 */
export async function findChangedPages(
  changedFiles: string[],
  pageExtensions: string[],
  ignore: (file: string) => boolean
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const entries = Object.entries(
    JSON.parse(
      (await readFile(".next/app-path-routes-manifest.json")).toString()
    )
  ) as [string, string][];

  const routes = entries.filter(
    ([fileName, path]) =>
      !fileName.endsWith("/route") && // Exclude route handlers
      !fileName.endsWith("/default") && // Exclude templates
      !path.match(/\(\.+\)/) // Exclude intercepting routes
  );

  const pageSet: Record<string, string[]> = {};

  // eslint-disable-next-line prefer-const
  for (let [fileName, path] of routes) {
    if (fileName === "/_not-found") {
      // Next.js renames this one in the route manifest
      fileName = "/not-found";
    }
    const result = await trace(fileName, pageExtensions, ignore);
    if (!result) {
      core.warning(
        `Could not trace page ${path} because its file name, ${fileName}, could not be resolved.`
      );
      continue;
    }
    const matches = Array.from(result.fileList).filter((it) =>
      changedFiles.includes(it)
    );
    pageSet[path] = matches;
  }

  for (const file of changedFiles) {
    if (
      !Object.entries(pageSet).some(([, matches]) => matches.includes(file))
    ) {
      console.warn(`Changed file ${file} did not affect any pages.`);
    }
  }

  // Prune broad matches that updated most or all pages
  const deps: Record<string, string[]> = {};

  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const [path, matches] of Object.entries(pageSet)) {
      for (const match of matches) {
        deps[match] = [...(deps[match] ?? []), path];
      }
    }

    for (const [id, parents] of Object.entries(deps)) {
      if (parents.length >= 8) {
        console.warn(
          `Ignoring update of ${id} because it affected too many pages (${parents.length}).`
        );
        for (const key in pageSet) {
          pageSet[key] = pageSet[key].filter((item) => item !== id);
        }
        delete deps[id];
        continue;
      }
    }
    break;
  }

  const changedPages = Object.entries(pageSet)
    .filter(([, matches]) => matches.length > 0)
    .map(([path]) => path);

  return changedPages;
}
