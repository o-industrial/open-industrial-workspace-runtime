import { EaCRuntimeHandler } from '@fathym/eac/runtime/pipelines';
import type { OpenIndustrialWebState } from '@o-industrial/common/runtimes';
import { redirectRequest } from '@fathym/common';
import { AgreementManager } from './AgreementManager.ts';

// Normalize paths so redirect comparisons ignore leading/trailing slash differences.
const normalizePathname = (path: string) => {
  if (!path.length) {
    return '/';
  }

  let normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
};

export const agreementsBlockerMiddleware: EaCRuntimeHandler<
  OpenIndustrialWebState
> = async (req, ctx) => {
  const manager = new AgreementManager(ctx.Runtime.IoC);

  const agreements = await manager.LoadAgreements();
  const userAccepted = await manager.LoadUserAccepted(ctx.State.Username!);

  if (manager.AgreementsOutOfDate(agreements, userAccepted)) {
    const url = new URL(req.url);

    const redirectUrl = ctx.Runtime.URLMatch.FromBase(`./agreements`);
    const redirectPath = normalizePathname(redirectUrl.pathname);
    const currentPath = normalizePathname(url.pathname);

    const isOnAgreementPage = currentPath === redirectPath ||
      currentPath.startsWith(`${redirectPath}/`);

    if (!isOnAgreementPage) {
      const returnUrl = encodeURIComponent(url.pathname + url.search);

      return redirectRequest(
        `${redirectUrl.pathname}?returnUrl=${returnUrl}`,
        false,
        false,
        req,
      );
    }
  }

  return ctx.Next();
};

