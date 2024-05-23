import * as core from "@actions/core";
import axios from "axios";
import JSZip from 'jszip';


export async function retrieveContrastResults(
  contrastInputs: ContrastInputs
): Promise<any> {
  const { token, apiKey } = contrastInputs
  const url = buildContrastUrl(contrastInputs);
  core.info(`Retrieving contrast results from ${url}`);

  return axios
    .get(url, {
      responseType: 'arraybuffer',
      headers: {
        contentType: "application/json",
        Authorization: token,
        APIKey: apiKey,
        Accept: 'application/x-zip-compressed'
      }
    })
    .then(async (response) => {
      const zip = await JSZip.loadAsync(response.data);

      const xmlFileName = Object.keys(zip.files)[0];
      const xmlContent = await zip.file(xmlFileName)?.async('string');

      if (core.isDebug()) {
        core.info(
          `Retrieved contrast results: ${xmlContent}`
        );
      }
      return xmlContent;
    });}

interface ContrastInputs {
  apiUrl: string;
  orgId: string;
  appId: string;
  apiKey: string;
  token: string;
}

export function getContrastInputs(): ContrastInputs {
  const apiUrl = core.getInput("contrast-api-url", { required: true });
  const orgId = core.getInput("contrast-org-id", { required: true });
  const appId = core.getInput("contrast-app-id", { required: true });
  const apiKey = core.getInput("contrast-api-key", { required: true });
  let token = core.getInput("contrast-token", { required: true });

  return { apiUrl, orgId, appId, apiKey, token };
}

function buildContrastUrl(inputs: ContrastInputs): string {
  const { apiUrl, orgId, appId } = inputs

  return `${apiUrl}/Contrast/api/ng/${orgId}/traces/${appId}/export/xml/all`;
}
