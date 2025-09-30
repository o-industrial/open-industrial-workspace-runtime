import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { EaCAzureAPIClient, loadEaCAzureAPISvc } from '@fathym/eac-azure/steward/clients';

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const azureToken = await ctx.State.AzureAccessToken?.();

    const svc: EaCAzureAPIClient | undefined = await loadEaCAzureAPISvc(ctx.State.OIJWT);

    const subs = await svc.Azure.Subscriptions(azureToken ?? '');
    return Response.json(subs);
  },
};
