import * as core from "@actions/core";
import { UserError } from "./errors";

export type Tool =
  | "sonar"
  | "codeql"
  | "semgrep"
  | "appscan"
  | "defectdojo"
  | "contrast"
  | "checkmarx"
  | "polaris"
  | "snyk";

/**
 * Helper function to get the selected tool from the action's inputs.
 * @returns The selected tool.
 * @throws {UserError} If the selected tool is invalid.
 */
export function getTool(): Tool {
  const tool = core.getInput("tool", { required: true }) as Tool;
  validateTool(tool);
  return tool;
}

function validateTool(tool: Tool) {
  if (!VALID_TOOLS.includes(tool)) {
    throw new UserError(
      `Invalid tool "${tool}". The tool must be one of: ${VALID_TOOLS.join(
        ", ",
      )}.`,
    );
  }
}

const VALID_TOOLS: Tool[] = [
  "sonar",
  "codeql",
  "semgrep",
  "appscan",
  "defectdojo",
  "contrast",
  "checkmarx",
  "polaris",
  "snyk",
];
