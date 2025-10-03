import { redirectRequest } from '@fathym/common';
import type { EaCCloudAzureDetails } from '@fathym/eac-azure';
import { EaCStatusProcessingTypes } from '@fathym/eac/steward/status';
import { EaCRuntimeHandlers } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

export const handler: EaCRuntimeHandlers<OpenIndustrialWebState> = {
  async POST(req, ctx) {
    const formData = await req.formData();

    const cloudLookup = 'Workspace';

    const azureToken = await ctx.State.AzureAccessToken?.();

    // Build minimal EaC workspace update for cloud configuration
    const wkspc = {
      EnterpriseLookup: ctx.State.WorkspaceLookup ?? ctx.Runtime.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          Token: azureToken,
          Details: {
            Name: (formData.get('name') as string) ?? 'Workspace Cloud',
            Description: (formData.get('description') as string) ??
              'The cloud used by the workspace.',
            ApplicationID: formData.get('application-id') as string,
            AuthKey: formData.get('auth-key') as string,
            SubscriptionID: formData.get('subscription-id') as string,
            TenantID: formData.get('tenant-id') as string,
            // Optional for create-subscription flow
            BillingScope: formData.get('billing-scope') as string,
            IsDev: (formData.get('is-dev') as string) === 'true' || undefined,
            Type: 'Azure',
          } as EaCCloudAzureDetails,
        },
      },
    };

    try {
      const status = await ctx.State.OIClient.Workspaces.Commit(
        {
          deletes: {},
          eac: wkspc,
        },
        true,
      );

      if (status.Processing === EaCStatusProcessingTypes.COMPLETE) {
        return redirectRequest('/', false, false);
      }

      // If not complete, fall through to show commit status page
      return redirectRequest(`/commit/${status.ID}`, false, false);
    } catch (_err) {
      // On API error, redirect back to workspace with a generic failure hint
      return redirectRequest('/?commit=error', false, false);
    }
  },
};
