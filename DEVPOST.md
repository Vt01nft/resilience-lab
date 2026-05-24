# Devpost Submission Copy

## Project Name

Resilience Lab

## Tagline

Replay the moment your AI agent breaks.

## Short Description

Resilience Lab is an agent flight recorder and chaos replay console. It injects model, MCP, retrieval, schema, and handoff failures, replays how the agent recovered, blocks unsafe paths, scores launch readiness, and exports evidence for launch reviews or regression tests.

## Inspiration

AI agents are easy to demo and hard to trust in production. The scary failures are rarely dramatic; they are partial outages, stale context, malformed tool output, silent escalation failures, and model brownouts. Resilience Lab was built around one question: before an agent reaches users, can we prove how it behaves when the stack breaks?

## What It Does

Resilience Lab lets a team pick a high-risk agent scenario, inject realistic dependency failures, and watch the recovery path. The console shows the active failure set, resilience score, dependency health, unsafe paths blocked, launch-gate status, remediation work, and an exportable report.

The judge demo opens directly into a claims-agent incident where the model, MCP tool, retrieval layer, and handoff path are degraded. The product shows that the agent should not guess, hide the outage, or continue with unsafe output. Instead, it blocks risky responses and creates an evidence trail.

## How We Built It

The prototype is a Vite, React, and TypeScript app with a deterministic replay engine in `src/engine.ts`. The engine creates scenario-specific failures, timelines, scores, dependency health states, regression checks, remediation tasks, and JSON reports. The UI is built as a production-style resilience dashboard with local session history and a one-click judge path.

## Sponsor Fit

Primary sponsor target: **TrueFoundry: Resilient Agents**.

The challenge asks how agents should behave when MCP servers fail, LLM providers go down, or infrastructure chaos reaches users. Resilience Lab is built directly for that problem. It makes failure behavior visible, repeatable, and enforceable before launch.

## What Makes It Different

This is not another chatbot or support assistant. Resilience Lab is reliability infrastructure for the agent stack itself. It focuses on the moment a production agent is least trustworthy: when dependencies fail and the system must decide whether to recover, refuse, escalate, or block release.

## Challenges

The hardest product decision was keeping the prototype focused. A generic monitoring dashboard would be easy to build but weak for judging. The stronger direction was to make the demo prove one thing extremely clearly: agent recovery behavior should be testable, replayable, and exportable.

## Accomplishments

- Built a full interactive replay console.
- Added realistic failures across model, MCP, retrieval, schema, and handoff layers.
- Added judge mode for a repeatable walkthrough.
- Added launch gate, dependency health, remediation, and evidence export.
- Polished the UI into a premium dark dashboard suitable for a hackathon demo.
- Deployed the app and published the source repo.

## What We Learned

Agent reliability is not only uptime. It is about whether the agent knows when not to answer, how to disclose degraded context, how to route recovery, and how teams can prove that behavior before launch.

## What's Next

- Capture real model and MCP traces.
- Run as a proxy around production agents.
- Convert replay sessions into CI regression tests.
- Add team workspaces and launch approvals.
- Add hosted incident reports for engineering, compliance, and customer operations.

## Links

- Live demo: https://resilience-lab-nine.vercel.app
- Judge mode: https://resilience-lab-nine.vercel.app?demo=judge
- GitHub: https://github.com/Vt01nft/resilience-lab
