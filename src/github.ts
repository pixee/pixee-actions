import * as github from "@actions/github";
import {Context} from "@actions/github/lib/context";
import * as core from "@actions/core";

/**
 * Normalized GitHub event context.
 */
export type GitHubContext = RepositoryInfo & PullRequestInfo

export interface RepositoryInfo {
  owner: string;
  repo: string;
}

export interface PullRequestInfo {
  sha: string;
  prNumber?: number;
}

/**
 * Maps the GitHub context from supported event types to the normalized GitHub context.
 *
 * This strategy assumes that the action is only triggered by supported events and that those events have common properties. However, we know that there are use cases where we need to handle events that do not have a pull request associated with them. Furthermore, the check_run event may be associated with multiple pull requests. Fixing this is the subject of a future change.
 *
 * @returns The normalized GitHub context.
 */
export async function getGitHubContext(): Promise<GitHubContext> {
  const context = github.context
  const { eventName} = context;

  const commitInfo =
    eventName !== 'workflow_dispatch' ? eventHandlers[eventName](context) : await getWorkflowDispatchContext(context)

  return { ...getRepositoryInfo(), ...commitInfo};
}

/**
 * Retrieves information about the current repository from the GitHub context.
 * @returns The information about the current repository
 */
export function getRepositoryInfo(): RepositoryInfo {
  const { owner, repo } = github.context.repo;
  return { owner, repo };
}

/**
 * @returns The path to the temporary directory.
 */
export function getTempDir(): string {
  const temp = process.env.RUNNER_TEMP;
  if (temp === undefined) {
    throw new Error("RUNNER_TEMP not set");
  }
  return temp;
}

function getPullRequestContext(
  context: Context
): PullRequestInfo {
  const prNumber = context.issue.number;
  const sha = context.payload.pull_request?.head.sha;

  return { prNumber, sha };
}

function getCheckRunContext(
  context: Context
): PullRequestInfo {
  const actionEvent = context.payload.check_run;
  const prNumber = actionEvent.pull_requests?.[0]?.number;
  const sha = actionEvent.head_sha;

  return { prNumber, sha };
}

/**
 * Retrieves commit information for a pull request from the GitHub API if the workflow
 * is triggered from a specified branch. Otherwise, returns the commit information
 * for the current branch.
 * @param context The GitHub context object containing information about the event.
 * @returns A Promise that resolves to a CommitInfo object with the SHA of the commit.
 */
async function getWorkflowDispatchContext(context: Context): Promise<PullRequestInfo> {
  const branchName: string = context.ref.substring('refs/heads/'.length);
  const allowedBranches: string[] = ['main', 'develop'];

  if (allowedBranches.includes(branchName)) {
    const token = core.getInput("token");
    const prNumber = core.getInput("pr-number");
    const {owner, repo} = getRepositoryInfo();

    return github.getOctokit(token).rest.pulls.get({
      owner,
      repo,
      pull_number: parseInt(prNumber)
    })
      .then((response) => {
        const sha: string = response.data.head.sha;
        return { sha };
      })
  }
  return {sha: context.sha}
}

const eventHandlers: {
  [eventName: string]: (
    context: Context
  ) => PullRequestInfo;
} = {
  check_run: getCheckRunContext,
  pull_request: getPullRequestContext
};
