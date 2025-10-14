# Agents Guide - open-industrial-workspace-runtime

Dedicated runtime for authenticated Open Industrial workspace experiences. Hosts tenant dashboards, Azure onboarding flows, and supporting APIs separate from the marketing/admin deployments.

## Scope
- Serve authenticated workspace UX under apps/workspace/** plus supporting assets and Tailwind bundle.
- Compose runtime plugins for MSAL, licensing, atomic icons, and OAuth tailored to workspace needs.
- Integrate with downstream EaC APIs (workspaces, licensing, Azure provisioning) through OpenIndustrialWebState.

## Project Map
- apps/workspace/** - workspace routes, API handlers, commit views, debug tools.
- apps/assets - static assets consumed by the workspace runtime.
- apps/tailwind - Tailwind styles template for workspace layout.
- src/plugins - runtime plugin composition (RuntimePlugin.ts, processor resolver).
- src/agreements, src/managers - workspace-specific helpers (agreements + current user KV manager).
- configs/ - runtime configuration (atomic icons, EaC actuators).
- tests/ - workspace-focused tests (agreements middleware/contracts).

## Commands
- deno task dev - launch runtime in watch mode (port 5416).
- deno task check - fmt + lint + type-check.
- deno task test - execute workspace tests.
- deno task build - full validation pipeline.
- Docker helpers: deno task build:docker, deno task refresh:docker.

## Patterns
- _middleware.ts issues workspace JWTs, loads active workspace via CurrentUserManager, and wires Azure token helpers.
- Each mutation route pairs UI with an api/ handler that redirects with HTTP 303 on success/failure.
- Shared UI comes from @o-industrial/common atomic exports; avoid duplicating components locally.
- Agreements middleware blocks access until required terms are accepted; keep tests updated when altering flows.

## Review & Test Checklist
- Validate _middleware.ts still hydrates workspace state, JWTs, and Azure access tokens.
- Confirm licensing/MSAL env vars documented in .env* and deployment secrets.
- Update agreements tests when flows or storage keys change.
- Run deno task test + manual smoke of workspace flows (dashboard, Azure connect, commit view).

## Safety & Guardrails
- Do not log sensitive license/user data; rely on structured logging helpers.
- Mutation endpoints must be idempotent and redirect via HTTP 303.
- Keep debug utilities behind strict auth and feature flags.
- Secrets belong in .env* only; repository should contain placeholders.

## Ownership & Contacts
- **Primary squad:** Workspace Experience Squad.
- **Slack channel:** #oi-workspace-runtime.
- **Escalation:** Runtime Architecture Guild.

## Dependencies & Integrations
- Consumes shared runtime helpers via @o-industrial/common/runtimes (state, access resolvers).
- Requires EaC Workspace + Licensing services, Azure AD B2C/MSAL configuration, and Stripe licensing webhooks.
- Proxied/embedded via the core runtime's WORKSPACE_ROOT proxy.

## Related Docs
- Repo inventory: [Agents.inventory.md](../Agents.inventory.md).
- Admin runtime guide: [open-industrial-admin-runtime/AGENTS.md](../open-industrial-admin-runtime/AGENTS.md).
- Workspace apps overview: [apps/Agents.md](apps/Agents.md).

## Changelog Expectations
- Update this guide whenever major workspace workflows, auth requirements, or deployment steps change.
- Keep env templates and documentation in sync with infrastructure updates.