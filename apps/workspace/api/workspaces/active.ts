import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

type SetActiveReq = {
  EnterpriseLookup?: string;
  WorkspaceLookup?: string;
  Lookup?: string;
};

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  POST: async (req, ctx) => {
    try {
      const ct = (req.headers.get('content-type') || '').toLowerCase();

      let lookup = '';

      if (ct.includes('application/json')) {
        const body = (await req.json()) as SetActiveReq;
        lookup = body.WorkspaceLookup || body.EnterpriseLookup || body.Lookup || '';
      } else if (
        ct.includes('application/x-www-form-urlencoded') ||
        ct.includes('multipart/form-data')
      ) {
        const form = await req.formData();
        lookup = (form.get('WorkspaceLookup') as string) ||
          (form.get('EnterpriseLookup') as string) ||
          (form.get('Lookup') as string) ||
          '';
      } else {
        // Fallback: try JSON then form
        try {
          const body = (await req.json()) as SetActiveReq;
          lookup = body.WorkspaceLookup || body.EnterpriseLookup || body.Lookup || '';
        } catch {
          const form = await req.formData();
          lookup = (form.get('WorkspaceLookup') as string) ||
            (form.get('EnterpriseLookup') as string) ||
            (form.get('Lookup') as string) ||
            '';
        }
      }

      if (!lookup || typeof lookup !== 'string') {
        return new Response('Missing workspace lookup', { status: 400 });
      }

      await ctx.State.CurrentUser.SetActiveWorkspace(
        ctx.State.Username!,
        lookup,
      );

      // Force a browser redirect to the workspace root for a clean context load
      return new Response(null, {
        status: 303,
        headers: { Location: '/' },
      });
    } catch (err) {
      console.error('Failed to set active workspace:', err);
      return new Response('Failed to set active workspace', { status: 500 });
    }
  },
};

export default handler;

