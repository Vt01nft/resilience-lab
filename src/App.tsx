import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  DatabaseZap,
  FileJson,
  Gauge,
  GitBranch,
  History,
  ListChecks,
  Play,
  RadioTower,
  RefreshCw,
  Route,
  ShieldCheck,
  Siren,
  TerminalSquare,
  TestTube2,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  allFailureKeys,
  createReplaySession,
  failureLabels,
  type FailureKey,
  type ReplaySession,
  scenarios,
  type StepStatus,
} from './engine'
import './App.css'

const statusLabel: Record<StepStatus, string> = {
  pass: 'Pass',
  warn: 'Watch',
  fail: 'Failed',
  recover: 'Recovered',
}

const statusIcon: Record<StepStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: Siren,
  recover: ShieldCheck,
}

const failureIcons: Record<FailureKey, typeof RadioTower> = {
  model: RadioTower,
  mcp: TerminalSquare,
  retrieval: DatabaseZap,
  schema: FileJson,
  handoff: Siren,
}

const savedSessionsKey = 'resilience-lab.sessions.v1'
const judgeDemoFailures: FailureKey[] = ['model', 'mcp', 'retrieval', 'handoff']

function App() {
  const startsInJudgeMode = new URLSearchParams(window.location.search).get('demo') === 'judge'
  const [scenarioId, setScenarioId] = useState(startsInJudgeMode ? 'claims' : scenarios[0].id)
  const [failures, setFailures] = useState<Set<FailureKey>>(
    () => new Set(startsInJudgeMode ? judgeDemoFailures : ['model', 'mcp', 'retrieval']),
  )
  const [sessions, setSessions] = useState<ReplaySession[]>(() => loadInitialSessions(startsInJudgeMode))
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'blocked'>('idle')

  const selectedScenario = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0]
  const previewSession = useMemo(
    () => createReplaySession(selectedScenario, failures),
    [failures, selectedScenario],
  )
  const hardenedSession = useMemo(
    () => createReplaySession(selectedScenario, new Set<FailureKey>()),
    [selectedScenario],
  )
  const activeSession = sessions[0] ?? previewSession
  const improvement = hardenedSession.score - activeSession.score

  useEffect(() => {
    localStorage.setItem(savedSessionsKey, JSON.stringify(sessions.slice(0, 8)))
  }, [sessions])

  function toggleFailure(key: FailureKey) {
    setFailures((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      setCopyState('idle')
      return next
    })
  }

  function runReplay(nextFailures = failures) {
    const session = createReplaySession(selectedScenario, nextFailures)
    setSessions((current) => [session, ...current].slice(0, 8))
    setCopyState('idle')
  }

  function runWorstCase() {
    const worstCase = new Set<FailureKey>(allFailureKeys)
    setFailures(worstCase)
    runReplay(worstCase)
  }

  function resetHealthy() {
    const healthy = new Set<FailureKey>()
    setFailures(healthy)
    runReplay(healthy)
  }

  function startJudgeDemo() {
    const demoFailures = new Set<FailureKey>(judgeDemoFailures)
    setScenarioId('claims')
    setFailures(demoFailures)
    const scenario = scenarios.find((item) => item.id === 'claims') ?? selectedScenario
    const session = createReplaySession(scenario, demoFailures)
    setSessions((current) => [session, ...current].slice(0, 8))
    setCopyState('idle')
  }

  async function copyReport() {
    const copied = await writeClipboard(activeSession.report)
    setCopyState(copied ? 'copied' : 'blocked')
  }

  function downloadReport() {
    const payload = JSON.stringify(activeSession, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeSession.id.toLowerCase()}-resilience-report.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="shell">
      <section className="hero-band">
        <nav className="topbar" aria-label="Product navigation">
          <div className="brand">
            <ShieldCheck size={22} />
            <span>Resilience Lab</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Run healthy replay" onClick={resetHealthy}>
              <RefreshCw size={18} />
            </button>
            <button className="primary-button" type="button" data-testid="run-replay" onClick={() => runReplay()}>
              <Play size={17} />
              Run replay
            </button>
            <button className="danger-button" type="button" data-testid="worst-case" onClick={runWorstCase}>
              <Zap size={17} />
              Worst case
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Agent reliability before production</p>
            <h1>Replay the moment your AI agent breaks.</h1>
            <p className="hero-text">
              Resilience Lab records model, MCP, retrieval, schema, and handoff failures, then turns them into a
              recovery timeline, launch score, and exportable regression artifact.
            </p>
            <div className="hero-actions">
              <button className="primary-button dark" type="button" onClick={() => runReplay()}>
                <Play size={17} />
                Capture session
              </button>
              <button className="secondary-button" type="button" onClick={downloadReport}>
                <ArrowDownToLine size={17} />
                Export JSON
              </button>
              <button className="secondary-button" type="button" data-testid="judge-demo" onClick={startJudgeDemo}>
                <ListChecks size={17} />
                Judge demo
              </button>
            </div>
          </div>

          <section className="runtime-panel" aria-label="Current replay report">
            <div className="runtime-header">
              <span>{activeSession.id}</span>
              <strong>{activeSession.readiness}</strong>
            </div>
            <div className="score-wheel" aria-label={`Resilience score ${activeSession.score} out of 100`}>
              <strong>{activeSession.score}</strong>
              <span>resilience score</span>
            </div>
            <div className="trace-lines">
              {activeSession.timeline.slice(-4).map((step) => {
                const Icon = statusIcon[step.status]
                return (
                  <article className={`trace-row ${step.status}`} key={`${step.at}-${step.label}`}>
                    <Icon size={17} />
                    <span>{step.at}</span>
                    <p>{step.label}</p>
                    <strong>{statusLabel[step.status]}</strong>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="metrics-band" aria-label="Resilience metrics">
        <Metric testId="score-metric" icon={Gauge} label="Score" value={`${activeSession.score}/100`} />
        <Metric testId="failures-metric" icon={Zap} label="Failures injected" value={String(activeSession.failures.length)} />
        <Metric testId="blocked-metric" icon={Bot} label="Unsafe paths blocked" value={String(activeSession.unsafePathsBlocked)} />
        <Metric testId="loss-metric" icon={ClipboardCheck} label="Loss avoided" value={activeSession.estimatedLossAvoided} />
      </section>

      <section className="workbench">
        <div className="section-heading">
          <p className="eyebrow">Chaos workbench</p>
          <h2>Pick a serious agent. Break its dependencies. Prove the recovery.</h2>
        </div>

        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <button
              className={`scenario-card ${scenario.id === scenarioId ? 'selected' : ''}`}
              key={scenario.id}
              type="button"
              data-testid={`scenario-${scenario.id}`}
              onClick={() => {
                setScenarioId(scenario.id)
                setCopyState('idle')
              }}
            >
              <span>{scenario.market}</span>
              <strong>{scenario.title}</strong>
              <p>{scenario.risk}</p>
            </button>
          ))}
        </div>

        <div className="lab-grid">
          <section className="control-surface" aria-label="Failure injection controls">
            <div className="panel-heading">
              <Route size={20} />
              <div>
                <h3>Failure injector</h3>
                <p>These toggles become replayable regression inputs.</p>
              </div>
            </div>
            <div className="failure-list">
              {allFailureKeys.map((key) => {
                const Icon = failureIcons[key]
                const active = failures.has(key)
                return (
                  <button
                    className={`failure-toggle ${active ? 'active' : ''}`}
                    type="button"
                    key={key}
                    data-testid={`failure-${key}`}
                    onClick={() => toggleFailure(key)}
                  >
                    <Icon size={19} />
                    <span>
                      <strong>{failureLabels[key]}</strong>
                      <small>{failureDescription(key)}</small>
                    </span>
                    <i>{active ? 'On' : 'Off'}</i>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="timeline-panel" aria-label="Replay timeline">
            <div className="panel-heading">
              <GitBranch size={20} />
              <div>
                <h3>Agent flight recorder</h3>
                <p>Timestamped evidence of what failed, what was blocked, and how the agent recovered.</p>
              </div>
            </div>
            <div className="timeline">
              {activeSession.timeline.map((step) => {
                const Icon = statusIcon[step.status]
                return (
                  <article className={`timeline-step ${step.status}`} key={`${step.at}-${step.label}`}>
                    <span>{step.at}</span>
                    <Icon size={18} />
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                    </div>
                    <em>{statusLabel[step.status]}</em>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="evidence-band">
        <section className="report-panel" aria-label="Generated report">
          <div className="panel-heading">
            <ClipboardCheck size={20} />
            <div>
              <h3>Evidence report</h3>
              <p>Copy this into a launch review, incident ticket, or Devpost demo narration.</p>
            </div>
          </div>
          <pre>{activeSession.report}</pre>
          <div className="button-row">
              <button className="primary-button dark" type="button" data-testid="copy-report" onClick={copyReport}>
                <Copy size={17} />
              {copyState === 'copied' ? 'Copied' : copyState === 'blocked' ? 'Copy blocked' : 'Copy report'}
              </button>
            <button className="secondary-button" type="button" data-testid="download-report" onClick={downloadReport}>
              <ArrowDownToLine size={17} />
              Download JSON
            </button>
          </div>
        </section>

        <section className="checks-panel" aria-label="Regression checks">
          <div className="panel-heading">
            <TestTube2 size={20} />
            <div>
              <h3>Regression checks</h3>
              <p>The replay becomes a product-quality gate.</p>
            </div>
          </div>
          <div className="check-list">
            {activeSession.checks.map((check) => {
              const Icon = statusIcon[check.result]
              return (
                <article className={`check-item ${check.result}`} key={check.name}>
                  <Icon size={18} />
                  <div>
                    <strong>{check.name}</strong>
                    <p>{check.expected}</p>
                  </div>
                  <span>{statusLabel[check.result]}</span>
                </article>
              )
            })}
          </div>
        </section>

        <section className={`ci-panel ${activeSession.ciGate.status}`} aria-label="CI launch gate">
          <div className="panel-heading">
            <TerminalSquare size={20} />
            <div>
              <h3>CI launch gate</h3>
              <p>{activeSession.ciGate.summary}</p>
            </div>
          </div>
          <code>{activeSession.ciGate.command}</code>
          <strong>{activeSession.ciGate.status === 'pass' ? 'Release allowed' : 'Release blocked'}</strong>
        </section>

        <section className="history-panel" aria-label="Saved replay history">
          <div className="panel-heading">
            <History size={20} />
            <div>
              <h3>Session history</h3>
              <p>Recent runs are saved locally for the demo.</p>
            </div>
          </div>
          <div className="history-list">
            {sessions.length === 0 ? (
              <p className="empty-state">Run a replay to capture the first session.</p>
            ) : (
              sessions.map((session, index) => (
                <button
                  className="history-item"
                  key={`${session.id}-${index}`}
                  type="button"
                  data-testid="history-item"
                  onClick={() => restoreSession(session)}
                >
                  <strong>{session.scenarioTitle}</strong>
                  <span>{session.id}</span>
                  <em>{session.score}/100</em>
                </button>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="operations-band">
        <section className="health-panel" aria-label="Dependency health matrix">
          <div className="panel-heading">
            <Activity size={20} />
            <div>
              <h3>Dependency health matrix</h3>
              <p>Replay traces by model, tool, retrieval, schema, and handoff layer.</p>
            </div>
          </div>
          <div className="health-grid">
            {activeSession.dependencyHealth.map((dependency) => {
              const Icon = statusIcon[dependency.status]
              return (
                <article className={`health-item ${dependency.status}`} key={dependency.name}>
                  <Icon size={18} />
                  <strong>{dependency.name}</strong>
                  <span>{dependency.latencyMs} ms</span>
                  <p>{dependency.detail}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="compare-panel" aria-label="Replay comparison">
          <div className="panel-heading">
            <GitBranch size={20} />
            <div>
              <h3>Before and after hardening</h3>
              <p>Judges can see exactly what gets better when teams fix the replay.</p>
            </div>
          </div>
          <div className="comparison">
            <article>
              <span>Current replay</span>
              <strong>{activeSession.score}/100</strong>
              <p>{activeSession.readiness}</p>
            </article>
            <ChevronRight size={28} />
            <article>
              <span>Hardened baseline</span>
              <strong>{hardenedSession.score}/100</strong>
              <p>{improvement > 0 ? `+${improvement} point recovery` : 'No gap detected'}</p>
            </article>
          </div>
        </section>

        <section className="remediation-panel" aria-label="Remediation backlog">
          <div className="panel-heading">
            <Wrench size={20} />
            <div>
              <h3>Auto-remediation backlog</h3>
              <p>Every failed replay becomes scoped engineering work.</p>
            </div>
          </div>
          <div className="task-list">
            {activeSession.remediationTasks.map((task) => (
              <article className={`task-item ${task.priority.toLowerCase()}`} key={task.title}>
                <span>{task.priority}</span>
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.detail}</p>
                  <em>{task.owner}</em>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="submission-band">
        <div className="section-heading">
          <p className="eyebrow">Submission readiness</p>
          <h2>Built for a two-minute judging window.</h2>
        </div>
        <div className="readiness-grid">
          <article>
            <strong>1</strong>
            <h3>Show the break</h3>
            <p>Click Judge demo or Worst case to trigger dependency failures immediately.</p>
          </article>
          <article>
            <strong>2</strong>
            <h3>Prove safe behavior</h3>
            <p>Point to the blocked unsafe answer, safe response, regression checks, and launch gate.</p>
          </article>
          <article>
            <strong>3</strong>
            <h3>Export the artifact</h3>
            <p>Download JSON or copy the report as the evidence package for release review.</p>
          </article>
          <article>
            <strong>4</strong>
            <h3>Make it reusable</h3>
            <p>Switch scenarios to show this works for claims, incidents, and vendor risk agents.</p>
          </article>
        </div>
      </section>

      <section className="architecture-band">
        <div className="section-heading">
          <p className="eyebrow">Startup version</p>
          <h2>A proxy, a recorder, and a replay engine for AI agents.</h2>
        </div>
        <div className="architecture-grid">
          <article>
            <Activity size={22} />
            <h3>Observe</h3>
            <p>Proxy model and MCP calls so prompts, tool payloads, timeouts, and schema drift are captured.</p>
          </article>
          <article>
            <AlertTriangle size={22} />
            <h3>Break</h3>
            <p>Inject brownouts, stale retrieval, malformed JSON, rate limits, and partial tool outages.</p>
          </article>
          <article>
            <CheckCircle2 size={22} />
            <h3>Prove</h3>
            <p>Replay the same session until the agent recovers safely, then export a score and test artifact.</p>
          </article>
        </div>
      </section>
    </main>
  )

  function restoreSession(session: ReplaySession) {
    const scenario = scenarios.find((item) => item.id === session.scenarioId)
    if (scenario) {
      setScenarioId(scenario.id)
    }
    setFailures(new Set(session.failures))
    setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)])
    setCopyState('idle')
  }
}

function loadInitialSessions(startsInJudgeMode: boolean) {
  const loaded = loadSessions()
  if (!startsInJudgeMode) {
    return loaded
  }

  const scenario = scenarios.find((item) => item.id === 'claims') ?? scenarios[0]
  return [createReplaySession(scenario, new Set(judgeDemoFailures)), ...loaded].slice(0, 8)
}

function Metric({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: typeof Gauge
  label: string
  value: string
  testId: string
}) {
  return (
    <article data-testid={testId}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function failureDescription(key: FailureKey) {
  const descriptions: Record<FailureKey, string> = {
    model: 'Primary model times out, returns partial output, or drops below latency SLO.',
    mcp: 'A required MCP tool returns 500s, 503s, or retry exhaustion.',
    retrieval: 'Knowledge search returns stale, conflicting, or low-confidence evidence.',
    schema: 'Tool output is malformed and cannot be trusted by the next agent step.',
    handoff: 'Ticket, incident channel, or human escalation write is unavailable.',
  }
  return descriptions[key]
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(savedSessionsKey)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as Array<Partial<ReplaySession>>
    return parsed
      .map((session) => {
        const scenario = scenarios.find((item) => item.id === session.scenarioId)
        if (!scenario) {
          return undefined
        }
        return session.ciGate && session.dependencyHealth && session.remediationTasks
          ? (session as ReplaySession)
          : createReplaySession(scenario, new Set(session.failures ?? []))
      })
      .filter((session): session is ReplaySession => Boolean(session))
  } catch {
    localStorage.removeItem(savedSessionsKey)
    return []
  }
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }
}

export default App
