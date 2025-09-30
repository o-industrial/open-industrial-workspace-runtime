import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';

import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: (_req, ctx) => {
    return Response.json(ctx.State.OIJWT);
  },
};
