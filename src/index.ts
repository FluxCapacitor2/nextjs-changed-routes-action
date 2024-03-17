import * as core from "@actions/core";
import { findChangedPages } from "./changedPages.js";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const separator = core.getInput("separator") ?? ",";
    const changedFiles = core.getInput("changedFiles").split(separator);
    const excludedPaths = core.getInput("excludedPaths")?.split(",");
    const includedPaths = core.getInput("includedPaths")?.split(",");

    if (excludedPaths && includedPaths) {
      core.warning(
        "Both includedPaths and excludedPaths are set. Only includedPaths will be used."
      );
    }

    const changedRoutes = await findChangedPages(changedFiles, (file) => {
      return includedPaths.includes(file);
    });

    core.setOutput("changedRoutes", changedRoutes.join(separator));
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

// Start the action
await run();
