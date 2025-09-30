import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { EaCAzureAPIClient, loadEaCAzureAPISvc } from '@fathym/eac-azure/steward/clients';

type AgreementType = string;

interface BillingAccount {
  id?: string;
  name?: string;
  properties?: {
    displayName?: string;
    agreementType?: AgreementType;
  };
}

interface BillingProfile {
  id?: string;
  name?: string;
  properties?: {
    displayName?: string;
  };
}

interface InvoiceSection {
  id?: string;
  name?: string;
  properties?: {
    displayName?: string;
  };
}

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const azureToken = await ctx.State.AzureAccessToken?.();

    if (!azureToken) {
      return Response.json({}, { status: 200 });
    }

    const svc: EaCAzureAPIClient | undefined = await loadEaCAzureAPISvc(ctx.State.OIJWT);

    if (!svc) {
      return Response.json({}, { status: 200 });
    }

    try {
      // Get billing accounts
      const accounts = await svc.Azure.BillingAccounts(azureToken) as BillingAccount[];

      // Build scopes in parallel across accounts
      const scopeEntriesPromises = accounts.map(async (acct) => {
        const props = acct.properties ?? {};
        const agreementType: AgreementType | undefined = props.agreementType;
        const accountName: string = props.displayName || acct.name || 'Billing Account';
        const entries: [string, string][] = [];

        if (agreementType === 'MicrosoftOnlineServicesProgram') {
          if (acct.id) {
            entries.push([acct.id, `MOSP - ${accountName}`]);
          }
        } else if (agreementType === 'MicrosoftCustomerAgreement') {
          if (!acct.name) return entries;

          // List profiles for this account
          const profiles = await svc.Azure.BillingProfiles(
            azureToken,
            acct.name,
          ) as BillingProfile[];

          // For each profile, list invoice sections in parallel
          const sectionEntriesArrays = await Promise.all(
            profiles.map(async (p: BillingProfile) => {
              const profName = p.properties?.displayName || p.name || 'Profile';
              if (!p.name) return [] as [string, string][];
              const sections = await svc.Azure.BillingInvoiceSections(
                azureToken,
                acct.name!,
                p.name,
              ) as InvoiceSection[];
              const sectionEntries: [string, string][] = [];
              for (const s of sections) {
                if (s.id) {
                  sectionEntries.push([
                    s.id,
                    `MCA - ${accountName} - ${profName} - ${s.properties?.displayName || s.name}`,
                  ]);
                }
              }
              return sectionEntries;
            }),
          );

          for (const arr of sectionEntriesArrays) {
            entries.push(...arr);
          }
        } else {
          // Other agreements not handled in this scopes endpoint (EA/MPA)
        }

        return entries;
      });

      const allEntries = (await Promise.all(scopeEntriesPromises)).flat();
      const scopes: Record<string, string> = Object.fromEntries(allEntries);

      return Response.json(scopes ?? {});
    } catch (err) {
      ctx.Runtime.Logs.Package.error(
        'There was an error loading billing scopes from EaC Azure.',
        err,
      );
    }

    return Response.json({}, { status: 200 });
  },
};

export default handler;
