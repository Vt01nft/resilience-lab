# Demo Video Script

## 90-Second Script

Most AI agent demos show the happy path. Resilience Lab shows the break.

This is an agent flight recorder for teams shipping AI agents into production. I can start in judge mode and replay a claims agent under realistic failure conditions: the model browns out, the policy MCP server fails, retrieval returns stale evidence, and the handoff path is blocked.

Instead of guessing or pretending everything is fine, the agent blocks unsafe output and creates a recovery trail. The dashboard shows the active failures, dependency health, resilience score, blocked paths, and whether this replay is safe to launch.

Now I can click Worst case. Every failure mode turns on, the score drops, and the launch gate blocks release. That is the point: the product does not just observe failure; it turns failure behavior into a release decision.

Finally, I can copy the report or export JSON evidence. That artifact can become a launch-review record, incident ticket, or regression test.

The same replay system works across claims, DevOps incident response, and vendor-risk agents. The goal is simple: before an AI agent reaches users, prove how it behaves when the stack breaks.

## Recording Checklist

1. Open `https://resilience-lab-nine.vercel.app?demo=judge`.
2. Pause on the hero and animated floating logo.
3. Click **Start judge demo**.
4. Point out the active failure count, unsafe paths blocked, launch gate, and evidence status.
5. Scroll through scenario selection and failure injection.
6. Show the replay timeline and recovery behavior.
7. Click **Worst case**.
8. Show the launch gate blocking release.
9. Click **Copy report**.
10. Click **Download JSON**.
11. Switch to another scenario to prove reuse.

## 30-Second Backup Script

Resilience Lab is an agent flight recorder. It tests what happens when an AI agent's model, MCP tools, retrieval, schema, or handoff systems fail. The product replays the incident, blocks unsafe answers, scores resilience, shows dependency health, and exports a report that can become a launch review or regression test. It is built for the TrueFoundry resilient agents challenge because it proves how an agent behaves when infrastructure chaos reaches production.
