/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from '@azure/arm-appservice';
import { createKuduClient } from '../createKuduClient';
import { SiteClient } from '../SiteClient';

export async function delayFirstWebAppDeploy(client: SiteClient, aspPromise: Promise<WebSiteManagementModels.AppServicePlan | undefined>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
    await new Promise<void>(async (resolve: () => void): Promise<void> => {
        setTimeout(resolve, 10000);
        try {
            // this delay is only valid for the first deployment to a Linux web app on a basic asp, so resolve for anything else
            if (client.isFunctionApp) {
                resolve();
            }

            const asp: WebSiteManagementModels.AppServicePlan | undefined = await aspPromise;
            if (!asp || !asp.sku || !asp.sku.tier || asp.sku.tier.toLowerCase() !== 'basic') {
                resolve();
            }
            if (!client.isLinux) {
                resolve();
            }

            const kuduClient = await createKuduClient(client);
            const deployments: number = (await kuduClient.deployment.getDeployResults()).length;
            if (deployments > 1) {
                resolve();
            }
        } catch (error) {
            // ignore the error, an error here isn't a deployment failure
            resolve();
        }
    });
}
