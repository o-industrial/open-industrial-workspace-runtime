import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { loadEaCAzureAPISvc } from '@fathym/eac-azure/steward/clients';
import type { EaCServiceDefinitions } from '@fathym/eac-azure';

// Returns available locations for core CALZ providers to help pick a region.
export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const svc = await loadEaCAzureAPISvc(ctx.State.OIJWT);

    const defs: EaCServiceDefinitions = {
      'Microsoft.Resources': { Types: [] },
      'Microsoft.Network': { Types: [] },
      'Microsoft.KeyVault': { Types: [] },
      'Microsoft.OperationalInsights': { Types: [] },
      'Microsoft.App': { Types: [] },
      'Microsoft.Storage': { Types: [] },
      'Microsoft.Devices': { Types: [] },
      'Microsoft.Kusto': { Types: [] },
    };

    const resp = await svc.Cloud.Locations('Workspace', defs);
    return Response.json(resp);
  },
};

export default handler;
