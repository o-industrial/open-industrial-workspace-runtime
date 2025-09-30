import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { loadEaCAzureAPISvc } from '@fathym/eac-azure/steward/clients';
import type { EaCServiceDefinitions } from '@fathym/eac-azure';

// Registers Azure resource providers to the Workspace cloud subscription.
export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  POST: async (req, ctx) => {
    const defs = (await req.json()) as EaCServiceDefinitions;
    const svc = await loadEaCAzureAPISvc(ctx.State.OIJWT);
    const resp = await svc.Cloud.EnsureProviders('Workspace', defs);
    return Response.json(resp);
  },
};

export default handler;
