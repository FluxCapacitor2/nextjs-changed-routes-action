import core from "@actions/core";
import { nodeFileTrace, resolve } from "@vercel/nft";
import esbuild from "esbuild";
import { type NextConfig } from "next";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve as pathResolve } from "node:path";

const nftCache = Object.create(null);
let pageExtensions = [".ts", ".tsx", ".js", ".jsx"];

await loadPageExtensions();

/**
 * Loads the `pageExtensions` property from the `next.config.(m)js` file
 */
async function loadPageExtensions(): Promise<void> {
  try {
    let fileName = "next.config.js";
    if (existsSync("next.config.mjs")) {
      fileName = "next.config.mjs";
    }
    if (existsSync(fileName)) {
      const { default: nextConfig } = (await import(fileName)) as {
        default: NextConfig;
      };
      pageExtensions = nextConfig.pageExtensions ?? pageExtensions;
    } else {
      core.warning(
        "No next.config.(m)js file found. Using default value for `pageExtensions`."
      );
    }
  } catch (e) {
    if (e instanceof Error) {
      core.error(e);
    }
    console.error(e);
    core.warning(
      "Failed to load next.config.(m)js file. Using default value for `pageExtensions`."
    );
  }
}

export async function trace(
  fileName: string,
  ignore: (file: string) => boolean
): ReturnType<typeof nodeFileTrace> {
  const fullFileName = await findFile(fileName);

  return await nodeFileTrace([fullFileName], {
    readFile: async (path) => {
      if (path.endsWith(".ts") || path.endsWith(".tsx")) {
        const res = await esbuild.build({
          format: "cjs",
          entryPoints: [path],
          bundle: false,
          platform: "node",
          write: false,
        });
        return res.outputFiles[0].text;
      }
      return await readFile(path);
    },
    exportsOnly: false,
    ignore,
    cache: nftCache,
    resolve: async (id, parent, job, isCjs) => {
      if (id.startsWith("@/")) {
        // Resolve the import alias at the root of the project
        return resolve(pathResolve(id.replace("@/", "")), parent, job, isCjs);
      }
      return resolve(id, parent, job, isCjs);
    },
  });
}

async function findFile(fileName: string): Promise<string> {
  for (const extension of pageExtensions) {
    if (existsSync(pathResolve(`${fileName}${extension}`))) {
      return fileName + extension;
    }
  }
  throw new Error(`Could not find file ${fileName}`);
}
