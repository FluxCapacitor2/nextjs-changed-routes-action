import core from "@actions/core";
import { nodeFileTrace, resolve } from "@vercel/nft";
import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve as pathResolve } from "node:path";

const nftCache = Object.create(null);

export async function trace(
  fileName: string,
  pageExtensions: string[],
  ignore: (file: string) => boolean
): Promise<Awaited<ReturnType<typeof nodeFileTrace>> | undefined> {
  const fullFileName = await findFile(fileName, pageExtensions);

  if (!fullFileName) {
    // The file couldn't be resolved
    core.warning(`Couldn't resolve file ${fileName}`);
    return undefined;
  }

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

async function findFile(
  fileName: string,
  pageExtensions: string[]
): Promise<string | undefined> {
  for (const extension of pageExtensions) {
    if (existsSync(pathResolve(`${fileName}${extension}`))) {
      return fileName + extension;
    }
  }
}
