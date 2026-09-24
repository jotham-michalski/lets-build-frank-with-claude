# ADR-009: Frank reads the classroom resource group

**Status:** Proposed — **formalizes, and supersedes the identity clause of,
ADR-004** ("system-assigned managed identity... no role assignments"): ADR-010
already replaced that in practice, this ADR just says so. On acceptance,
update ADR-004's Status line and both README tables.
**Date:** 2026-09

## Context

The closing demo asks Frank *"what's running in your resource group?"* and
expects a real answer. ADR-004 and ADR-006 assumed a managed identity granted
`Reader` after each student's first deploy; ADR-010 removed that path. Frank
now runs with the Contributor-scoped client-secret credential — and the
`AZURE_SUBSCRIPTION_ID`/`AZURE_RESOURCE_GROUP` — that `deploy.yml` already
injects into every container. There's no identity or handoff left to build.

That resource group is **shared across the whole class**, not private to one
student: the registry, the Container Apps environment, and everyone's
`frank-*` app live in it together.

## Decision

- Add one tool, `list_resources`, per ADR-002: `list` verb, strict zod input
  with no parameters (scope is never caller-supplied), output `summary` plus
  a typed array of resource name/type/location.
- Read Azure with the official SDK (`@azure/identity` + `@azure/arm-resources`);
  `DefaultAzureCredential` and the two env vars above need no new code to
  reach the tool. `server/src/config.ts` gains `azureSubscriptionId` and
  `azureResourceGroup`, read from env, optional so `npm run dev` and existing
  tests keep working unconfigured.
- The handler never throws a raw SDK message. It catches any Azure error
  (missing config, network, auth) and produces `isError: true` with a
  plain-language message — extend `registerTools`'s wrapper to pass that
  through, since today it always returns success.

## Consequences

- Implementable immediately: no portal step, no instructor script.
- **The real cost of this ADR:** any anonymous caller of Frank's
  unauthenticated `/mcp` can now inventory the *entire class's* shared
  registry, environment, and every classmate's app — not a private view, and
  with Contributor's word, not a scoped `Reader`'s. ADR-007's rejection of
  auth assumed a narrower, per-seat picture than this.
- The credential stays over-privileged for what this tool calls — a cost
  ADR-010 already accepted.
- New runtime dependency (the Azure SDK), and a new failure shape: the
  existing generic conventions test that invokes every no-argument tool's
  handler must be taught this one can legitimately fail closed in CI, where
  no Azure credentials exist — a repair to existing test code, not just a new
  test file.
- Rejected: restoring managed identity + `Reader` — reintroduces the handoff
  ADR-010 removed. Rejected: a `resourceGroup` parameter — the point is that
  no caller redirects Frank elsewhere.
