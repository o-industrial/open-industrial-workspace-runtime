import { EaCStatusProcessingTypes } from '@fathym/eac/steward/status';
import { EaCRuntimeHandlers } from '@fathym/eac/runtime/pipelines';
import type { EaCCloudAzureDetails } from '@fathym/eac-azure';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

type ManagedSubscriptionRequest = {
  name?: string;
  description?: string;
  billingScope?: string;
  isDev?: boolean;
  agreementType?: string;
};

export const handler: EaCRuntimeHandlers<OpenIndustrialWebState> = {
  async POST(req, ctx) {
    const contentType = req.headers.get('content-type') ?? '';

    let body: ManagedSubscriptionRequest = {};

    if (contentType.includes('application/json')) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const billingScope = body.billingScope ?? Deno.env.get('AZURE_MANAGED_BILLING_SCOPE');

    if (!billingScope) {
      return Response.json(
        { error: 'Managed billing scope is not configured.' },
        { status: 500 },
      );
    }

    const agreementType = body.agreementType ?? Deno.env.get('AZURE_MANAGED_AGREEMENT_TYPE');

    const cloudLookup = 'Workspace';
    const workspaceName = ctx.State.Workspace.EnterpriseLookup;

    const name = workspaceName;
    const description = body.description ??
      'Managed Azure subscription provisioned by Open Industrial.';
    const isDev = body.isDev ?? true;

    const managedDetails = {
      Type: 'Azure',
      Name: name,
      Description: description,
      ApplicationID: '',
      AuthKey: '',
      SubscriptionID: '',
      TenantID: '',
      BillingScope: billingScope,
      IsDev: isDev,
      ...(agreementType ? { AgreementType: agreementType } : {}),
    } as unknown as EaCCloudAzureDetails;

    const wkspPatch = {
      EnterpriseLookup: ctx.State.WorkspaceLookup ?? ctx.Runtime.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          Details: managedDetails,
        },
      },
    };

    try {
      const status = await ctx.State.OIClient.Workspaces.Commit(
        { deletes: {}, eac: wkspPatch },
        true,
      );

      const redirect = status.Processing === EaCStatusProcessingTypes.COMPLETE
        ? '/'
        : `/commit/${status.ID}`;

      return Response.json({ status, redirect });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start managed subscription.';

      return Response.json({ error: message }, { status: 500 });
    }
  },
};
