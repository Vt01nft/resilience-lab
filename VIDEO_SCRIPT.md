# Resilience Lab Demo Script

## 90-second version

Most AI agent demos show the happy path. Resilience Lab shows the break.

This is an agent flight recorder for production teams. I can click Judge demo and immediately replay a claims agent under real failure conditions: the model browns out, the policy MCP fails, retrieval returns stale evidence, and escalation is blocked.

Instead of guessing, the agent blocks the unsafe answer. The flight recorder shows what failed, when it failed, what was refused, and what safe response was generated.

The score drops to show the replay is not production-ready. The CI launch gate blocks release, the dependency health matrix shows which layers failed, and the remediation backlog turns the replay into engineering work.

Finally, I can export the JSON evidence report. That artifact can become a launch-review record, incident ticket, or regression test. The same system works across claims, DevOps incident response, and vendor-risk agents.

The goal is simple: before an AI agent reaches users, prove how it behaves when the stack breaks.

## Recording checklist

- Start on the hero.
- Click `Judge demo`.
- Show the live replay score and active failures.
- Scroll to the flight recorder and point to the blocked unsafe answer.
- Show the evidence report.
- Show regression checks and CI launch gate.
- Show dependency health and auto-remediation backlog.
- Click `Download JSON`.
- Switch to DevOps Incident Agent to show the product is reusable.

## Devpost fields

- Project name: Resilience Lab
- Tagline: Replay the moment your AI agent breaks.
- Sponsor target: TrueFoundry: Resilient Agents
- Main differentiator: This is not another chatbot. It is reliability infrastructure for testing agent failure behavior before production.
