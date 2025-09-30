import { redirectRequest } from '@fathym/common';
import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { EverythingAsCodeOIWorkspace } from '@o-industrial/common/eac';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { loadEaCActuators } from '../../../configs/eac-actuators.config.ts';

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const wkspc: EverythingAsCodeOIWorkspace = {
      EnterpriseLookup: ctx.State.WorkspaceLookup,
      Actuators: loadEaCActuators(),
    };

    const _commitStatus = await ctx.State.OIClient.Workspaces.Commit({
      deletes: {},
      eac: wkspc,
    });

    return redirectRequest(ctx.Runtime.URLMatch.Base, false, false);
  },
};
