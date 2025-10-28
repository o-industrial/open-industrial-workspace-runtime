import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { loadEaCAzureAPISvc } from '@fathym/eac-azure/steward/clients';
import type { EaCServiceDefinitions } from '@fathym/eac-azure';

const DEFAULT_SERVICE_DEFINITIONS: EaCServiceDefinitions = {
  'Microsoft.Resources': { Types: [] },
  'Microsoft.Network': { Types: [] },
  'Microsoft.KeyVault': { Types: [] },
  'Microsoft.OperationalInsights': { Types: [] },
  'Microsoft.Insights': { Types: [] },
  'Microsoft.Authorization': { Types: [] },
};

type LocationsRequestPayload = {
  cloudLookup?: string;
  serviceDefinitions?: EaCServiceDefinitions;
};

function resolveDefinitions(
  payload: LocationsRequestPayload | undefined,
): { cloudLookup: string; serviceDefinitions: EaCServiceDefinitions } {
  const cloudLookup = payload?.cloudLookup && payload.cloudLookup.length > 0
    ? payload.cloudLookup
    : 'Workspace';

  const svcDefs = payload?.serviceDefinitions;
  const serviceDefinitions = svcDefs && Object.keys(svcDefs).length > 0
    ? svcDefs
    : DEFAULT_SERVICE_DEFINITIONS;

  return { cloudLookup, serviceDefinitions };
}

// Returns available locations for Azure providers to help pick a region.
export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const svc = await loadEaCAzureAPISvc(ctx.State.OIJWT);

    const resp = await svc.Cloud.Locations(
      'Workspace',
      DEFAULT_SERVICE_DEFINITIONS,
    );

    return Response.json(resp);
  },

  POST: async (req, ctx) => {
    const svc = await loadEaCAzureAPISvc(ctx.State.OIJWT);

    let payload: LocationsRequestPayload | undefined;
    try {
      payload = await req.json();
    } catch {
      payload = undefined;
    }

    const { cloudLookup, serviceDefinitions } = resolveDefinitions(payload);

    const resp = await svc.Cloud.Locations(cloudLookup, serviceDefinitions);

    return Response.json(resp);
  },
};
