import * as core from "@actions/core";
import micromatch from "micromatch";
import { findChangedPages } from "./changedPages";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const separator = core.getInput("separator") ?? ",";
    const changedFiles = core.getInput("changedFiles").split(separator);

    const pageExtensions = core.getInput("pageExtensions").split(separator);

    const includedPaths = core
      .getInput("includedPaths")
      ?.trim()
      ?.split("\n")
      ?.map((item) => item.trim());

    const changedRoutes = await findChangedPages(
      changedFiles,
      pageExtensions,
      (file) => !micromatch.isMatch(file, includedPaths)
    );

    if (changedRoutes.length > 0) {
      core.info(`Changed routes:\n${changedRoutes.join("\n")}`);
    } else {
      core.info("No changed routes found.");
    }
    core.info("Done!");
    core.setOutput("changedRoutes", changedRoutes.join(separator));
  } catch (error) {
    core.error(`An error occurred while finding changed routes: ${error}`);
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

core.info("Finding changed routes...");

// Start the action
run();
