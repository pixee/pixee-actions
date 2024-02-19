import * as core from "@actions/core";
import {buildError, buildTriggerApiUrl, buildUploadApiUrl} from "./util";
import axios from "axios";
import {UploadInputs} from "./upload-inputs";
import fs from "fs";
import FormData from "form-data";

const UTF = 'utf-8'
const AUDIENCE = 'https://app.pixee.ai'

export function uploadInputFile(inputs: UploadInputs) {
    const { file, tool} = inputs
    const fileContent = fs.readFileSync(file, UTF);
    const form = new FormData();
    form.append('file', fileContent);

    const tokenPromise = core.getIDToken(AUDIENCE)

    tokenPromise.then(token => {
            try {
                axios.put(buildUploadApiUrl(tool), form, {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then(response => {
                        if (response.status != 204) {
                            core.setFailed(`Failed response status: ${response.status}`);
                            return
                        }
                    })
                    .catch(error => buildError(error));
            } catch (error) {
                buildError(error);
            }
        }
    )
}

export function triggerPrAnalysis(prNumber: number) {
    const tokenPromise = core.getIDToken(AUDIENCE)

    tokenPromise.then(token => {
        try {
            axios.post(buildTriggerApiUrl(prNumber), null, {
                headers: {
                    contentType: 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })
                .then(response => {
                    if (response.status != 204) {
                        core.setFailed(`Failed response status: ${response.status}`);
                        return
                    }
                })
                .catch(error => buildError(error));
        } catch (error) {
            buildError(error)
        }
    })
}
