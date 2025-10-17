import { EaCRuntimeHandlerSet } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';

import { buildDefaultWorkspace } from '../../../../src/workspaces/buildDefaultWorkspace.ts';

type CreateWorkspacePayload = {
  Description?: string;
  Name?: string;
  description?: string;
  name?: string;
};

const parsePayload = async (
  req: Request,
): Promise<CreateWorkspacePayload> => {
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase();

  if (contentType.includes('application/json')) {
    return await req.json() as CreateWorkspacePayload;
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await req.formData();

    return {
      Name: (form.get('Name') ?? form.get('name') ?? '') as string,
      Description: (form.get('Description') ??
        form.get('description') ??
        '') as string,
    };
  }

  try {
    return await req.json() as CreateWorkspacePayload;
  } catch {
    const form = await req.formData();

    return {
      Name: (form.get('Name') ?? form.get('name') ?? '') as string,
      Description: (form.get('Description') ??
        form.get('description') ??
        '') as string,
    };
  }
};

export const handler: EaCRuntimeHandlerSet<OpenIndustrialWebState> = {
  POST: async (req, ctx) => {
    try {
      const payload = await parsePayload(req);
      const rawName = payload.Name ?? payload.name ?? '';
      const rawDescription = payload.Description ?? payload.description ?? '';

      const name = typeof rawName === 'string' ? rawName.trim() : '';
      const description = typeof rawDescription === 'string'
        ? rawDescription.trim()
        : '';

      if (!name) {
        return new Response('Workspace name is required.', { status: 400 });
      }

      const newWorkspace = buildDefaultWorkspace({
        name,
        description,
      });

      const result = await ctx.State.OIClient.Workspaces.Create(newWorkspace);

      return new Response(JSON.stringify(result), {
        status: 201,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    } catch (err) {
      console.error('Failed to create workspace from helper.', err);

      return new Response('Failed to create workspace.', { status: 500 });
    }
  },
};

export default handler;
