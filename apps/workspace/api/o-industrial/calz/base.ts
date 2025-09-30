import { EaCRuntimeHandlers } from '@fathym/eac/runtime/pipelines';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

export const handler: EaCRuntimeHandlers<OpenIndustrialWebState> = {
  async POST(req, ctx) {
    const { region, rgName, tags } = await req.json();

    const cloudLookup = 'Workspace';

    const wkspPatch = {
      EnterpriseLookup: ctx.State.WorkspaceLookup ?? ctx.Runtime.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          ResourceGroups: {
            [rgName]: {
              Details: {
                Name: rgName,
                Description: 'Private CALZ base resource group',
                Location: region,
              },
              Tags: tags ?? undefined,
            },
          },
        },
      },
    };

    const status = await ctx.State.OIClient.Workspaces.Commit(
      { deletes: {}, eac: wkspPatch },
      true,
    );

    return Response.json({ status });
  },
};

export default handler;
