# Agents Guide - Workspace Runtime Apps

Overview of app surfaces hosted by open-industrial-workspace-runtime.

## Directories

- workspace/ � core workspace application (dashboards, Azure connect, commits, debug). See [workspace guide](workspace/Agents.md).
- ssets/ � static assets served by the workspace runtime.
- ailwind/ � Tailwind styles template consumed by the runtime build.

## Notes

- Keep workspace routes paired with colocated pi/ handlers for mutations.
- Asset additions require licensing/brand review; keep files optimized.
- Tailwind updates should remain compatible with the shared config (	ailwind.config.ts).

## Ownership

- **Primary owner:** Workspace Experience Squad.
- **Contact:** #oi-workspace-runtime Slack channel.
- **Escalation:** Runtime Architecture Guild.

## Changelog

- Update this doc when adding new app directories or changing ownership.
