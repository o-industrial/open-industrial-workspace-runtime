import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

// Validates the saved cloud credentials by delegating to the API runtime so all surfaces share the same logic.
export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (req, ctx) => {
    const url = new URL(req.url);
    const cloudLookup = url.searchParams.get('cloud') || 'Workspace';

    try {
      const result = await ctx.State.OIClient.Workspaces.ValidateCloud(cloudLookup);
      return Response.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ valid: false, message }, { status: 200 });
    }
  },
};

export default handler;
