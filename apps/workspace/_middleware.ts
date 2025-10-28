import { loadJwtConfig, redirectRequest } from '@fathym/common';
import { EaCRuntimeHandler } from '@fathym/eac/runtime/pipelines';
import { loadEaCLicensingSvc } from '@fathym/eac-licensing/clients';
import { EverythingAsCodeOIWorkspace } from '@o-industrial/common/eac';
import { OpenIndustrialAPIClient } from '@o-industrial/common/api';
import { OpenIndustrialJWTPayload } from '@o-industrial/common/types';

import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { AgreementManager } from '../../src/agreements/AgreementManager.ts';
// import { agreementsBlockerMiddleware } from '../../src/agreements/agreementsBlockerMiddleware.ts';
import { loadEaCActuators } from '../../configs/eac-actuators.config.ts';
import { EaCRuntimeContext } from '@fathym/eac/runtime';
import { EaCAzureADProviderDetails } from '@fathym/eac-identity';
import {
  createAzureADOAuthConfig,
  createOAuthHelpers,
} from '@fathym/common/oauth';
import { EaCApplicationsRuntimeContext } from '@fathym/eac-applications/runtime';
import { CurrentUserManager } from '../../src/managers/CurrentUserManager.ts';

export default [
  // agreementsBlockerMiddleware,
  buildOpenIndustrialRuntimeMiddleware('oi'),
  // buildAgreementsRedirectMiddleware(),
] as EaCRuntimeHandler<OpenIndustrialWebState>[];

/**
 * Sets up OI API client, loads or creates workspace,
 * and commits runtime state into `OpenIndustrialWebState`.
 */
export function buildOpenIndustrialRuntimeMiddleware(
  kvLookup: string = 'eac'
): EaCRuntimeHandler<OpenIndustrialWebState> {
  return async (
    req,
    ctx: EaCRuntimeContext<
      OpenIndustrialWebState,
      Record<string, unknown>,
      EverythingAsCodeOIWorkspace
    >
  ) => {
    const appCtx = ctx as EaCApplicationsRuntimeContext<OpenIndustrialWebState>;

    const username = ctx.State.Username!;
    const kv = await ctx.Runtime.IoC.Resolve(Deno.Kv, kvLookup);
    ctx.State.OIKV = kv;

    ctx.State.CurrentUser = new CurrentUserManager(ctx.State.OIKV);

    const oiApiRoot = Deno.env.get('OPEN_INDUSTRIAL_API_ROOT')!;
    const apiBaseUrl = new URL(oiApiRoot);

    let lookup: string | undefined;

    lookup = await ctx.State.CurrentUser.GetActiveWorkspace(username);

    ctx.State.OIJWT = await loadJwtConfig().Create({
      Username: username,
      EnterpriseLookup: lookup,
      WorkspaceLookup: lookup,
      AccessRights: appCtx.Runtime.AccessRights,
    } as OpenIndustrialJWTPayload);

    ctx.State.OIClient = new OpenIndustrialAPIClient(
      apiBaseUrl,
      ctx.State.OIJWT
    );

    ctx.State.Workspace = await ctx.State.OIClient.Workspaces.Get();

    // Verify it exists
    if (!ctx.State.Workspace?.EnterpriseLookup) {
      lookup = '';

      ctx.State.OIJWT = await loadJwtConfig().Create({
        Username: username,
        EnterpriseLookup: lookup,
        WorkspaceLookup: lookup,
        AccessRights: appCtx.Runtime.AccessRights,
      } as OpenIndustrialJWTPayload);

      ctx.State.OIClient = new OpenIndustrialAPIClient(
        apiBaseUrl,
        ctx.State.OIJWT
      );
    }

    const userWorkspaces = await ctx.State.OIClient.Workspaces.ListForUser();

    ctx.State.UserWorkspaces = userWorkspaces;

    // 🔁 If no current workspace saved, ask the API
    if (!lookup) {
      lookup = ctx.State.UserWorkspaces[0]?.EnterpriseLookup;

      if (lookup) {
        await ctx.State.CurrentUser.SetActiveWorkspace(username, lookup);

        ctx.State.OIJWT = await loadJwtConfig().Create({
          Username: username,
          EnterpriseLookup: lookup,
          WorkspaceLookup: lookup,
          AccessRights: appCtx.Runtime.AccessRights,
        } as OpenIndustrialJWTPayload);

        ctx.State.OIClient = new OpenIndustrialAPIClient(
          apiBaseUrl,
          ctx.State.OIJWT
        );
      }
    }

    // 🚫 Still no workspace? Create one
    if (!lookup) {
      const newWorkspace: EverythingAsCodeOIWorkspace = {
        Details: {
          Name: 'hello-azi',
          Description: 'Getting started with Open Industrial and Azi.',
        },
        Actuators: loadEaCActuators(),
        Packs: {
          // AzureIoT: {
          //   Details: {
          //     Path: '@o-industrial/azure-iot-pack',
          //   },
          // },
          OICore: {
            Details: {
              Path: '@o-industrial/oi-core-pack',
            },
          },
        },
        Clouds: {},
      };

      const createResp = await ctx.State.OIClient.Workspaces.Create(
        newWorkspace
      );

      lookup = createResp.EnterpriseLookup;

      await ctx.State.CurrentUser.SetActiveWorkspace(username, lookup);

      ctx.State.OIJWT = await loadJwtConfig().Create({
        Username: username,
        EnterpriseLookup: lookup,
        WorkspaceLookup: lookup,
        AccessRights: appCtx.Runtime.AccessRights,
      } as unknown as OpenIndustrialJWTPayload);

      ctx.State.OIClient = new OpenIndustrialAPIClient(
        apiBaseUrl,
        ctx.State.OIJWT
      );
    }

    // ✅ Load full workspace state via API
    ctx.State.Workspace = await ctx.State.OIClient.Workspaces.Get();

    ctx.State.WorkspaceLookup = lookup!;

    if (username) {
      const providerLookup = 'azure';

      const provider = ctx.Runtime.EaC!.Providers![providerLookup]!;

      const providerDetails = provider.Details as EaCAzureADProviderDetails;

      ctx.State.AzureAccessToken = async () => {
        const oAuthConfig = createAzureADOAuthConfig(
          providerDetails!.ClientID,
          providerDetails!.ClientSecret,
          providerDetails!.TenantID,
          providerDetails!.Scopes
        );

        const helpers = createOAuthHelpers(oAuthConfig);

        const sessionId = await helpers.getSessionId(req);

        const oauthKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(
          Deno.Kv,
          provider.DatabaseLookup
        );

        const currentAccTok = await oauthKv.get<string>([
          'MSAL',
          'Session',
          sessionId!,
          'AccessToken',
        ]);

        if (currentAccTok.value) {
          return currentAccTok.value;
        }

        return undefined;
      };
    }

    if (username) {
      const parentJwt = await loadJwtConfig().Create({
        EnterpriseLookup: ctx.Runtime.EaC.EnterpriseLookup!,
        WorkspaceLookup: ctx.Runtime.EaC.EnterpriseLookup!,
        Username: username,
        AccessRights: appCtx.Runtime.AccessRights,
      });

      const licSvc = await loadEaCLicensingSvc(parentJwt);

      const licRes = await licSvc.License.Get(
        ctx.Runtime.EaC.EnterpriseLookup!,
        username,
        'o-industrial'
      );

      if (licRes.Active) {
        ctx.State.UserLicenses = {
          'o-industrial': licRes.License,
        };
      }
    }

    return ctx.Next();
  };
}

export function buildAgreementsRedirectMiddleware(): EaCRuntimeHandler<OpenIndustrialWebState> {
  return async (req, ctx) => {
    const appCtx = ctx as EaCApplicationsRuntimeContext<OpenIndustrialWebState>;

    const token = await loadJwtConfig().Create({
      WorkspaceLookup: ctx.State.WorkspaceLookup,
      Username: ctx.State.Username,
      AccessRights: appCtx.Runtime.AccessRights,
    });

    ctx.State.OIJWT = token;

    const manager = new AgreementManager(ctx.Runtime.IoC);
    const agreements = await manager.LoadAgreements();
    const accepted = await manager.LoadUserAccepted(ctx.State.Username!);

    if (manager.AgreementsOutOfDate(agreements, accepted)) {
      const url = new URL(req.url);
      if (!url.pathname.startsWith('/agreements')) {
        const returnUrl = encodeURIComponent(url.pathname + url.search);
        return redirectRequest(
          `/agreements?returnUrl=${returnUrl}`,
          false,
          false,
          req
        );
      }
    }

    return ctx.Next();
  };
}
