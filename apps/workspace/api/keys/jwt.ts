import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { loadJwtConfig } from '@fathym/common';

import { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { OpenIndustrialJWTPayload } from '@o-industrial/common/types';
import { EaCApplicationsRuntimeContext } from '@fathym/eac-applications/runtime';

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  GET: async (req, ctx) => {
    try {
      const appCtx = ctx as EaCApplicationsRuntimeContext<OpenIndustrialWebState>;

      const url = new URL(req.url);

      // Accept minutes via `minutes` or `expMinutes`; default to 60 minutes
      const minutesParam = url.searchParams.get('minutes') ?? url.searchParams.get('expMinutes');

      const minutes = minutesParam ? Number(minutesParam) : 60;

      const expDate = new Date(Date.now() + Math.max(1, minutes) * 60_000);

      const token = await loadJwtConfig().Create(
        {
          Username: ctx.State.Username!,
          WorkspaceLookup: ctx.State.WorkspaceLookup,
          AccessRights: appCtx.Runtime.AccessRights,
        } as OpenIndustrialJWTPayload,
        expDate.getTime(),
      );

      return Response.json({ Token: token });
    } catch (err) {
      console.error('Failed to mint OI JWT:', err);
      return new Response('Failed to mint token', { status: 500 });
    }
  },
};

export default handler;
