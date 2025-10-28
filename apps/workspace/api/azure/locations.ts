import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { loadEaCAzureAPISvc } from '@fathym/eac-azure/steward/clients';
import type { EaCServiceDefinitions } from '@fathym/eac-azure';

const DEFAULT_SERVICE_DEFINITIONS: EaCServiceDefinitions = {
  'Microsoft.Resources': { Types: ['resourceGroups', 'deployments'] },
  'Microsoft.Network': { Types: ['virtualNetworks', 'virtualNetworks/subnets'] },
  'Microsoft.KeyVault': { Types: ['vaults'] },
  'Microsoft.OperationalInsights': { Types: ['workspaces'] },
  'Microsoft.Insights': { Types: ['diagnosticSettings', 'actionGroups', 'components'] },
  'Microsoft.Authorization': { Types: ['policyAssignments', 'roleAssignments'] },
  'Microsoft.AlertsManagement': { Types: ['smartDetectorAlertRules'] },
  'Microsoft.Devices': { Types: ['IotHubs', 'IotHubs/eventHubEndpoints/ConsumerGroups'] },
  'Microsoft.SignalRService': { Types: ['SignalR'] },
  'Microsoft.Web': { Types: ['sites', 'serverfarms', 'sourcecontrols'] },
  'Microsoft.Security': { Types: ['iotSecuritySolutions'] },
  'Microsoft.Storage': { Types: ['storageAccounts'] },
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

function ensureWorkspaceCloud(
  ctx: Parameters<EaCRuntimeHandlerSet<OpenIndustrialWebState>['GET']>[1],
  cloudLookup: string,
): Response | undefined {
  const cloud = ctx.State.Workspace?.Clouds?.[cloudLookup];

  if (!cloud) {
    return Response.json(
      {
        error: `Cloud '${cloudLookup}' is not configured for this workspace.`,
      },
      { status: 400 },
    );
  }

  return undefined;
}

async function resolveLocations(
  cloudLookup: string,
  serviceDefinitions: EaCServiceDefinitions,
  ctx: Parameters<EaCRuntimeHandlerSet<OpenIndustrialWebState>['GET']>[1],
) {
  const svc = await loadEaCAzureAPISvc(ctx.State.OIJWT);

  return await svc.Cloud.Locations(
    cloudLookup,
    serviceDefinitions,
  );
}

// Returns available locations for Azure providers to help pick a region.
export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const cloudLookup = 'Workspace';

    const early = ensureWorkspaceCloud(ctx, cloudLookup);
    if (early) return early;

    try {
      const resp = await resolveLocations(
        cloudLookup,
        DEFAULT_SERVICE_DEFINITIONS,
        ctx,
      );

      return Response.json(resp);
    } catch (err) {
      ctx.Runtime?.Logs?.Package?.error?.(
        `Failed to load Azure locations for ${cloudLookup}`,
        err,
      );

      return Response.json(
        {
          error: 'Unable to load Azure locations for the current workspace cloud.',
        },
        { status: 502 },
      );
    }
  },

  POST: async (req, ctx) => {
    let payload: LocationsRequestPayload | undefined;
    try {
      payload = await req.json();
    } catch {
      payload = undefined;
    }

    const { cloudLookup, serviceDefinitions } = resolveDefinitions(payload);

    const early = ensureWorkspaceCloud(ctx, cloudLookup);
    if (early) return early;

    try {
      const resp = await resolveLocations(
        cloudLookup,
        serviceDefinitions,
        ctx,
      );

      return Response.json(resp);
    } catch (err) {
      ctx.Runtime?.Logs?.Package?.error?.(
        `Failed to load Azure locations for ${cloudLookup}`,
        err,
      );

      return Response.json(
        {
          error: 'Unable to load Azure locations for the requested workspace cloud.',
        },
        { status: 502 },
      );
    }
  },
};
