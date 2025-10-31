import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import { EaCApplicationsRuntimeContext } from '@fathym/eac-applications/runtime';
import { loadJwtConfig } from '@fathym/common';
import { OpenIndustrialAPIClient } from '@o-industrial/common/api';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

type ArchiveWorkspaceRequest = {
  WorkspaceLookup?: string;
  Lookup?: string;
};

const parseLookup = async (req: Request): Promise<string> => {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const body = await req.json() as ArchiveWorkspaceRequest;
    return body.WorkspaceLookup || body.Lookup || '';
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await req.formData();
    return (form.get('WorkspaceLookup') as string) ||
      (form.get('Lookup') as string) ||
      '';
  }

  try {
    const body = await req.json() as ArchiveWorkspaceRequest;
    return body.WorkspaceLookup || body.Lookup || '';
  } catch {
    const form = await req.formData();
    return (form.get('WorkspaceLookup') as string) ||
      (form.get('Lookup') as string) ||
      '';
  }
};

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  async POST(req, ctx) {
    try {
      const lookup = (await parseLookup(req)).trim();

      if (!lookup) {
        return new Response('Missing workspace lookup', { status: 400 });
      }

      if (ctx.State.WorkspaceLookup === lookup) {
        return new Response('Cannot archive the active workspace.', {
          status: 400,
        });
      }

      const appCtx = ctx as EaCApplicationsRuntimeContext<OpenIndustrialWebState>;

      const jwt = await loadJwtConfig().Create({
        Username: ctx.State.Username!,
        WorkspaceLookup: lookup,
        EnterpriseLookup: lookup,
        AccessRights: appCtx.Runtime.AccessRights,
      });

      const oiApiRoot = Deno.env.get('OPEN_INDUSTRIAL_API_ROOT');
      if (!oiApiRoot) {
        return new Response('API root not configured.', { status: 500 });
      }

      const apiClient = new OpenIndustrialAPIClient(new URL(oiApiRoot), jwt);

      const status = await apiClient.Workspaces.Archive();

      return Response.json(status);
    } catch (err) {
      console.error('Failed to archive workspace:', err);
      const message = err instanceof Error
        ? err.message
        : 'Failed to archive workspace.';
      return new Response(message, { status: 500 });
    }
  },
};

export default handler;
