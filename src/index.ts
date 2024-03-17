import * as core from "@actions/core";
import micromatch from "micromatch";
import { findChangedPages } from "./changedPages.js";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const separator = core.getInput("separator") ?? ",";
    const changedFiles = core.getInput("changedFiles").split(separator);

    const includedPaths = core
      .getInput("includedPaths")
      ?.trim()
      ?.split("\n")
      ?.map((item) => item.trim());

    const changedRoutes = await findChangedPages(
      changedFiles,
      (file) => !micromatch.isMatch(file, includedPaths)
    );

    core.setOutput("changedRoutes", changedRoutes.join(separator));
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

// Start the action
await run();
