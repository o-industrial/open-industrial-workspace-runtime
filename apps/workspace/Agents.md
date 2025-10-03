# Agents Guide - Workspace App

Authenticated portal for managing workspaces, Azure onboarding, commits, and licensing. Routes assume MSAL/ADB2C auth and workspace licensing enforced via runtime plugins.

## Scope

- Dashboard landing, Azure connection flows, commit detail views, and debugging utilities.
- Agreements acceptance and JWT refresh flows implemented via colocated API handlers.
- Server mutations implemented via pi/ handlers that call ctx.State.OIClient and redirect on completion.

## Project Map

- _layout.tsx � shell component wiring navigation and ensuring auth context.
- _middleware.ts � hydrates OpenIndustrialWebState, loads active workspace, and prepares Azure tokens.
- index.tsx � dashboard landing (metrics, quick actions).
- greements/ � agreements UI + API.
- commit/[commitId].tsx � workspace commit status view.
- zure/ � Azure connection diagnostics.
- debug/ � workspace-only diagnostics (gated).
- pi/** � mutation handlers (Azure provisioning, workspace activation, JWT refresh, etc.).

## Commands

- deno task dev � run runtime locally; sign in with workspace tenant to validate flows.
- deno task test � run workspace-specific tests.
- deno task build � full validation prior to release.

## Patterns

- Pair UI routes with pi/ handlers; use Response.redirect(..., 303) after successful writes.
- Pull shared UI from @o-industrial/atomic/*; avoid bespoke markup.
- Access control depends on OpenIndustrialLicensingPlugin + OpenIndustrialMSALPlugin wired in src/plugins/RuntimePlugin.ts.
- Agreements middleware blocks access until all required terms accepted.

## Review & Test Checklist

- Confirm _middleware.ts still issues JWTs and resolves access rights for new routes.
- Validate Azure provisioning flows in staging before production rollouts.
- Update tests in 	ests/src/agreements when changing agreements flows.
- Document new environment variables in .env* and deployment notes.

## Safety & Guardrails

- Never log PII or secrets; rely on structured logging with redaction.
- Ensure mutation endpoints are idempotent; handle EaC errors gracefully and surface readable messages.
- Keep debug utilities behind strict auth/feature flags.

## Ownership

- **Squad:** Workspace Experience Squad.
- **Contact:** #oi-workspace-runtime Slack.
- **Escalation:** Runtime Architecture Guild.

## Dependencies & Integrations

- Requires EaC Workspace APIs via ctx.State.OIClient.
- Uses Azure AD B2C + MSAL session storage provided by the runtime plugin.
- Licensing and Stripe integration configured through environment variables consumed by OpenIndustrialLicensingPlugin.

## Related Docs

- Apps overview: [../Agents.md](../Agents.md).
- Runtime overview: [../../AGENTS.md](../../AGENTS.md).
- Reference architecture documentation: shared atomic components & runtime helpers in sibling repo.

## Changelog Expectations

- Update after major workflow changes (workspace provisioning, Azure onboarding) or auth adjustments.
- Maintain release notes for workspace operators and support teams.

