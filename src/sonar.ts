import * as core from "@actions/core";
import axios from "axios";
import { getGitHubContext } from "./github";

/**
 * Response from SonarCloud API search endpoint. Sparse implementation, because we only care about the total number of issues.
 */
interface SonarSearchResults {
  total: number;
}

export async function retrieveSonarCloudResults(
  sonarCloudInputs: SonarCloudInputs
) {
  const { token } = sonarCloudInputs;
  const url = buildSonarCloudUrl(sonarCloudInputs);
  core.debug(`Retrieving SonarCloud results from ${url}`);
  return axios
    .get(url, {
      headers: {
        contentType: "application/json",
        Authorization: `Bearer ${token}`,
      },
      responseType: "json",
    })
    .then((response) => {
      if (core.isDebug()) {
        core.debug(
          `Retrieved SonarCloud results: ${JSON.stringify(response.data)}`
        );
      }
      return response.data as SonarSearchResults;
    });
}

interface SonarCloudInputs {
  token: string;
  componentKey: string;
  apiUrl: string;
}

export function getSonarCloudInputs(): SonarCloudInputs {
  const apiUrl = core.getInput("sonar-api-url", { required: true });
  const token = core.getInput("sonar-token", { required: true });
  let componentKey = core.getInput("sonar-component-key");
  if (!componentKey) {
    const { owner, repo } = getGitHubContext();
    componentKey = `${owner}_${repo}`;
  }
  return { token, componentKey, apiUrl };
}

function buildSonarCloudUrl({
  apiUrl,
  componentKey,
}: SonarCloudInputs): string {
  const { prNumber } = getGitHubContext();
  const url = `${apiUrl}/issues/search?componentKeys=${encodeURIComponent(
    componentKey
  )}&resolved=false`;
  return prNumber ? `${url}&pullRequest=${prNumber}` : url;
}
