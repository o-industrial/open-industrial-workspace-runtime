import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (_req, ctx) => {
    const token = await ctx.State.AzureAccessToken?.();
    return Response.json({ connected: !!token });
  },
};
