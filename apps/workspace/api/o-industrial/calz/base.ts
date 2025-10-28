import { EaCRuntimeHandlers } from '@fathym/eac/runtime/pipelines';
import {
  EaCFoundationAsCode,
  EaCFoundationDetails,
} from '@o-industrial/common/eac';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

type CloudFoundationPlanRequest = {
  region?: string;
  rgName?: string;
  tags?: Record<string, string>;
  foundationPlan?: Partial<EaCFoundationDetails>;
};

function coalesceFoundationPlan(
  workspaceLookup: string,
  region: string,
  rgName: string,
  incoming?: Partial<EaCFoundationDetails>
): EaCFoundationDetails {
  const baseResourceGroup = incoming?.ResourceGroup ?? {
    Name: rgName,
    Location: region,
  };

  return {
    Type: incoming?.Type ?? 'CloudFoundationPlan',
    Name: incoming?.Name ?? 'Private Cloud Foundation Plan',
    Description:
      incoming?.Description ??
      'Blueprint inputs for provisioning the workspace landing zone and guardrails.',
    Order: incoming?.Order ?? 1,
    WorkspaceLookup: incoming?.WorkspaceLookup || workspaceLookup,
    ResourceGroup: {
      Name: baseResourceGroup.Name || rgName,
      Location: baseResourceGroup.Location || region,
      Tags: baseResourceGroup.Tags,
    },
    Network: incoming?.Network,
    KeyVault: incoming?.KeyVault,
    LogAnalytics: incoming?.LogAnalytics,
    Diagnostics: incoming?.Diagnostics,
    Governance: incoming?.Governance,
  } as EaCFoundationDetails;
}

export const handler: EaCRuntimeHandlers<OpenIndustrialWebState> = {
  async POST(req, ctx) {
    const body = (await req.json()) as CloudFoundationPlanRequest;

    const region = (body.region || '').trim();
    const rgName = (body.rgName || '').trim();

    if (!region || !rgName) {
      return Response.json(
        {
          error:
            'Both `region` and `rgName` are required to configure the foundation.',
        },
        { status: 400 }
      );
    }

    const workspaceLookup =
      ctx.State.WorkspaceLookup ?? ctx.Runtime.EaC!.EnterpriseLookup;
    const cloudLookup = 'Workspace';

    let foundationPlan = coalesceFoundationPlan(
      workspaceLookup!,
      region,
      rgName,
      body.foundationPlan
    );

    if (body.tags && Object.keys(body.tags).length > 0) {
      foundationPlan.ResourceGroup = {
        ...foundationPlan.ResourceGroup,
        Tags: {
          ...(foundationPlan.ResourceGroup?.Tags ?? {}),
          ...body.tags,
        },
      };
    }

    const foundationLookup = 'cloud-foundation-plan';

    const foundationResource: EaCFoundationAsCode = {
      CloudLookup: cloudLookup,
      Details: foundationPlan,
    };

    const wkspPatch = {
      EnterpriseLookup: workspaceLookup,
      Foundations: {
        [foundationLookup]: foundationResource,
      },
    };

    const status = await ctx.State.OIClient.Workspaces.Commit(
      { deletes: {}, eac: wkspPatch },
      true,
      { awaitStatus: false }
    );

    return Response.json({
      status,
      commitId: status.CommitID ?? status.ID ?? null,
    });
  },
};
