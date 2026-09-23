# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A one-day course repo (Buckshot Technologies) for building **Frank**: an MCP
server with a Cloudscape web console, deployed to Azure Container Apps. The
architecture is fully decided in `docs/adr/` — implement from the ADRs, don't
freelance the stack or conventions. Start at `docs/adr/README.md` for the
decision index; `docs/adr/ADR-000-record-architecture-decisions.md` explains
the ADR workflow itself.

## Current state: `server/` and `ui/` are empty

Both contain only `.gitkeep`, on purpose — they're built from the ADRs during
class. There's no `package.json` yet, so none of the commands below run until
that scaffolding exists. Two things already tolerate this:
`.github/workflows/deploy.yml`'s PR jobs detect a missing
`server/package-lock.json` / `ui/package-lock.json` and post a notice instead
of failing; the root `Dockerfile`'s UI stage does the same for a missing
`ui/package.json` (Frank still builds and deploys with no console).

## Commands (once scaffolded, per the ADRs)

**`server/`** — TypeScript on Node 22+, self-contained npm package (ADR-001):
```bash
npm run dev      # tsx watch
npm test         # vitest, server/test/**/*.test.ts
npm run build    # tsc
```
Single test: `npx vitest run test/<file>.test.ts` (add `-t "<name>"` to filter).

**`ui/`** — React 18 + Vite, self-contained npm package (ADR-003):
```bash
npm run dev
npm test
npm run build
```

**Full image**, matching what the deploy pipeline actually runs:
```bash
docker build -t frank .   # context is the repo root, not server/ — a
                          # server/-scoped build can't reach ui/
```
The Dockerfile *is* the build-and-test gate on `main`: `npm test` runs inside
both the `ui-build` and `server-build` stages, so a red suite fails the image
build and nothing deploys. There's no separate lint command defined anywhere
in the repo yet.

## Architecture

### Everything flows from `docs/adr/`
This project is built by AI agents directed by engineers; the ADRs are the
in-distribution bridge, so read the numbered decision rather than inferring
conventions from habit. In rough order of how often they matter day to day:

- **ADR-002** — tool naming, schema, and read-only conventions (below).
- **ADR-001** — server stack: TypeScript + official `@modelcontextprotocol/sdk`,
  Streamable HTTP on `POST /mcp`, `GET /healthz` for health probes, zod input
  validation, all config via env vars.
- **ADR-003** — console stack: React + Vite + Cloudscape only, two pages
  (Overview, Tools), tool forms generated from each tool's input schema.
- **ADR-006 / ADR-010** (both Accepted; 010 supersedes 006's credential model
  and distribution) — one container serves both server and console; one
  shared, deliberately public classroom Azure credential is fetched by the
  pipeline at deploy time, so students run zero setup commands.
- **ADR-004 / ADR-005** — partially superseded by ADR-006; read the
  supersession note at the top of each before trusting a specific clause.
- **ADR-007** — **Rejected** (MCP bearer-token auth). Kept as the repo's
  worked example of a rejected decision, not a live spec — don't implement
  from it.
- **ADR-008 / ADR-009** — not written yet. ADR-009 (Frank reads his own
  resource group) is authored during class via `/adr`, then implemented.

An ADR is immutable once **Accepted**: changing course means a *new* ADR that
supersedes the old one (wholly, or by naming the exact clauses it replaces) —
never edit an accepted ADR's decision text in place. The narrow exception is
updating a superseded ADR's **Status** line to record what superseded it.

### MCP tool conventions (ADR-002) — apply to every tool
- Name `verb_noun`, lower snake_case. Verb comes from the **closed set**
  `get` / `list` / `search` / `summarize`. `create_*`, `update_*`, `delete_*`,
  `run_*` are out of policy — if one seems genuinely needed, that requires an
  ADR superseding ADR-002, not a new tool.
- One module per tool in `server/src/tools/`, registered in
  `server/src/tools/index.ts`, with a test under `server/test/`.
- Input validated with `zod`, unknown fields rejected; every parameter gets a
  description written for a model deciding whether to call the tool.
- Output is structured JSON: a top-level `summary` string plus typed detail
  fields. Errors return `isError: true` with a plain-language message — never
  a stack trace.
- **Read-only, hard rule.** No tool mutates Azure, GitHub, or the filesystem
  beyond temp space. This bounds the blast radius of whatever Azure credential
  Frank ends up holding; any write capability needs its own ADR first.

### Deployment shape (ADR-006 / ADR-010)
One root-level multi-stage `Dockerfile`: builds `ui/` (tolerating an empty
one), builds `server/`, then a runtime image where Frank's own Express app
serves the console at `/` and MCP at `POST /mcp`. `.github/workflows/deploy.yml`:
pull requests build and test only, no Azure involved; pushes to `main` build
the image with `az acr build` and deploy with `az containerapp create`/`update`
(deliberately not `az containerapp up --source`, which crashes on some
azure-cli builds). Students set up nothing — the workflow fetches a shared,
short-lived classroom credential from a `CREDENTIAL_URL` committed in the
workflow, and Frank runs at runtime with that same credential via
`DefaultAzureCredential`. The container app name is derived from the GitHub
account, so a student's own fork is their isolation.

### `.claude/` is itself part of the architecture, not scaffolding to delete
- `skills/frank-tools/` — the ADR-002 conventions above, loaded when the model
  judges a tool is being added, named, or changed.
- `agents/adr-reviewer.md` (**opus**) — reviews ADR drafts for
  implementability, contradictions with other ADRs or `.github/workflows/`,
  honest consequences, and one-page-ness. `/adr` always delegates to it
  explicitly; asking "is this ADR ready?" in plain conversation may or may not
  trigger it — that's expected model-mediated routing, not a bug.
- `agents/tool-conventions.md`, `agents/secret-scanner.md` (**haiku**) —
  mechanical checklist audits over `server/src/tools/` and the whole tree
  respectively, kept cheap on purpose. All three agents are restricted to
  `Read, Grep, Glob` — a reviewer that can edit the repo isn't a reviewer.
- `commands/adr.md` (`/adr <title>`) — scaffolds a new ADR (next number,
  template, `Status: Proposed`), updates both ADR tables (`docs/adr/README.md`
  and the root `README.md`), and hands the draft to `adr-reviewer` before
  anything is committed. It leaves the ADR uncommitted — accepting one is a
  human decision.

The model/effort choice is deliberate per task shape: opus for judgment work
(spotting a contradiction, deciding implementability), haiku for
breadth-over-cleverness (grepping many files against a fixed checklist). Match
that pattern for any new agent added here rather than defaulting to one model
everywhere.
