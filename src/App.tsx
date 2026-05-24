import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Copy,
  Database,
  FileJson,
  Play,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Users,
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

const savedSessionsKey = 'resilience-lab.sessions.v1'
const judgeDemoFailures: FailureKey[] = ['model', 'mcp', 'retrieval', 'handoff']

const failureIcons: Record<FailureKey, typeof RadioTower> = {
  model: RadioTower,
  mcp: Wrench,
  retrieval: Database,
  schema: FileJson,
  handoff: Users,
}

const statusLabel: Record<StepStatus, string> = {
  pass: 'Pass',
  warn: 'Watch',
  fail: 'Failed',
  recover: 'Recovered',
}

function App() {
  const startsInJudgeMode = new URLSearchParams(window.location.search).get('demo') === 'judge'
  const [scenarioId, setScenarioId] = useState(startsInJudgeMode ? 'claims' : scenarios[0].id)
  const [failures, setFailures] = useState<Set<FailureKey>>(
    () => new Set(startsInJudgeMode ? judgeDemoFailures : ['model', 'mcp', 'retrieval']),
  )
  const [sessions, setSessions] = useState<ReplaySession[]>(() => loadInitialSessions(startsInJudgeMode))
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'blocked'>('idle')
  const [toast, setToast] = useState('Ready')

  const selectedScenario = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0]
  const previewSession = useMemo(
    () => createReplaySession(selectedScenario, failures),
    [failures, selectedScenario],
  )
  const activeSession = sessions[0] ?? previewSession

  useEffect(() => {
    localStorage.setItem(savedSessionsKey, JSON.stringify(sessions.slice(0, 8)))
  }, [sessions])

  function captureReplay(nextFailures = failures) {
    const session = createReplaySession(selectedScenario, nextFailures)
    setSessions((current) => [session, ...current].slice(0, 8))
    setCopyState('idle')
    setToast(`Replay captured: ${session.score}/100`)
  }

  function startJudgeDemo() {
    const demoFailures = new Set<FailureKey>(judgeDemoFailures)
    const scenario = scenarios.find((item) => item.id === 'claims') ?? selectedScenario
    setScenarioId('claims')
    setFailures(demoFailures)
    setSessions((current) => [createReplaySession(scenario, demoFailures), ...current].slice(0, 8))
    setCopyState('idle')
    setToast('Judge demo loaded')
  }

  function runWorstCase() {
    const worstCase = new Set<FailureKey>(allFailureKeys)
    setFailures(worstCase)
    captureReplay(worstCase)
  }

  function resetHealthy() {
    const healthy = new Set<FailureKey>()
    setFailures(healthy)
    captureReplay(healthy)
  }

  function toggleFailure(key: FailureKey) {
    setFailures((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      setToast(`${failureLabels[key]} ${next.has(key) ? 'enabled' : 'disabled'}`)
      return next
    })
  }

  async function copyReport() {
    const copied = await writeClipboard(activeSession.report)
    setCopyState(copied ? 'copied' : 'blocked')
    setToast(copied ? 'Report copied' : 'Copy blocked by browser')
  }

  function downloadReport() {
    const blob = new Blob([JSON.stringify(activeSession, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeSession.id.toLowerCase()}-resilience-report.json`
    link.click()
    URL.revokeObjectURL(url)
    setToast('JSON report exported')
  }

  return (
    <main className="simple-shell">
      <a className="floating-logo" href="https://github.com/Vt01nft/resilience-lab" target="_blank" aria-label="Open GitHub repository">
        <span className="logo-ring" />
        <img src="/resilience-lab-logo.svg" alt="" />
      </a>

      <header className="hero">
        <nav className="topbar">
          <div className="brand">
            <img src="/resilience-lab-logo.svg" alt="" />
            <span>Resilience Lab</span>
          </div>
          <div className="top-actions">
            <a href="https://github.com/Vt01nft/resilience-lab" target="_blank">GitHub</a>
            <a href="https://resilience-lab-nine.vercel.app?demo=judge">Judge link</a>
          </div>
        </nav>

        <section className="hero-grid">
          <div>
            <p className="eyebrow">Agent reliability before production</p>
            <h1>Replay the moment your AI agent breaks.</h1>
            <p className="hero-copy">
              Test how an AI agent behaves when models, MCP tools, retrieval, schemas, or handoffs fail.
              Resilience Lab turns the failure into a score, recovery timeline, launch gate, and exportable report.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary" data-testid="judge-demo" onClick={startJudgeDemo}>
                <Play size={18} />
                Start judge demo
              </button>
              <button type="button" onClick={() => captureReplay()}>
                <RefreshCw size={18} />
                Capture replay
              </button>
              <button type="button" className="danger" data-testid="worst-case" onClick={runWorstCase}>
                <Zap size={18} />
                Worst case
              </button>
            </div>
          </div>

          <section className="score-card">
            <span>Current replay</span>
            <strong>{activeSession.score}/100</strong>
            <p>{activeSession.readiness}</p>
            <div className={`gate-pill ${activeSession.ciGate.status}`}>
              {activeSession.ciGate.status === 'pass' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {activeSession.ciGate.status === 'pass' ? 'Launch allowed' : 'Launch blocked'}
            </div>
          </section>
        </section>
      </header>

      <section className="quick-stats">
        <Stat label="Failures" value={String(activeSession.failures.length)} detail={activeSession.failures.map((key) => failureLabels[key]).join(', ') || 'None'} />
        <Stat label="Unsafe paths blocked" value={String(activeSession.unsafePathsBlocked)} detail="Guardrails prevented unsupported output" />
        <Stat label="Evidence report" value="Ready" detail="Copy or download JSON for Devpost/demo" />
        <Stat label="Impact avoided" value={activeSession.estimatedLossAvoided} detail="Estimated risk contained by recovery path" />
      </section>

      <section className="workspace">
        <section className="panel">
          <div className="section-title">
            <span>1</span>
            <div>
              <h2>Choose an agent</h2>
              <p>Switch scenarios to show this is reusable infrastructure.</p>
            </div>
          </div>
          <div className="scenario-grid">
            {scenarios.map((scenario) => (
              <button
                className={scenario.id === scenarioId ? 'active' : ''}
                type="button"
                data-testid={`scenario-${scenario.id}`}
                key={scenario.id}
                onClick={() => {
                  setScenarioId(scenario.id)
                  setToast(`${scenario.title} selected`)
                }}
              >
                <span>{scenario.market}</span>
                <strong>{scenario.title}</strong>
                <small>{scenario.risk}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <span>2</span>
            <div>
              <h2>Inject failures</h2>
              <p>Toggle chaos conditions and capture a replay.</p>
            </div>
          </div>
          <div className="failure-grid">
            {allFailureKeys.map((key) => {
              const Icon = failureIcons[key]
              const active = failures.has(key)
              return (
                <button
                  className={active ? 'active' : ''}
                  type="button"
                  data-testid={`failure-${key}`}
                  key={key}
                  onClick={() => toggleFailure(key)}
                >
                  <Icon size={20} />
                  <span>{failureLabels[key]}</span>
                  <small>{active ? 'Enabled' : 'Off'}</small>
                </button>
              )
            })}
          </div>
        </section>

        <section className="panel timeline-panel">
          <div className="section-title">
            <span>3</span>
            <div>
              <h2>Review recovery timeline</h2>
              <p>See exactly what failed, what was blocked, and how the agent recovered.</p>
            </div>
          </div>
          <div className="timeline">
            {activeSession.timeline.map((step) => (
              <article className={step.status} key={`${step.at}-${step.label}`}>
                <time>{step.at}</time>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.detail}</p>
                </div>
                <em>{statusLabel[step.status]}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="panel side-panel">
          <div className="section-title">
            <span>4</span>
            <div>
              <h2>Launch gate</h2>
              <p>{activeSession.ciGate.summary}</p>
            </div>
          </div>
          <div className={`launch-box ${activeSession.ciGate.status}`}>
            <ShieldCheck size={32} />
            <strong>{activeSession.ciGate.status === 'pass' ? 'Safe to launch' : 'Release blocked'}</strong>
            <code>{activeSession.ciGate.command}</code>
          </div>
          <div className="dependency-list">
            {activeSession.dependencyHealth.map((dependency) => (
              <article className={dependency.status} key={dependency.name}>
                <span>{dependency.name}</span>
                <strong>{statusLabel[dependency.status]}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="panel report-panel">
          <div className="section-title">
            <span>5</span>
            <div>
              <h2>Export evidence</h2>
              <p>Use this report in Devpost, a launch review, or a regression test.</p>
            </div>
          </div>
          <pre>{activeSession.report}</pre>
          <div className="report-actions">
            <button type="button" data-testid="copy-report" onClick={copyReport}>
              <Copy size={18} />
              {copyState === 'copied' ? 'Copied' : copyState === 'blocked' ? 'Copy blocked' : 'Copy report'}
            </button>
            <button type="button" data-testid="download-report" onClick={downloadReport}>
              <ArrowDownToLine size={18} />
              Download JSON
            </button>
            <button type="button" onClick={resetHealthy}>
              <Terminal size={18} />
              Healthy baseline
            </button>
          </div>
        </section>
      </section>

      <div className="toast" role="status">{toast}</div>
    </main>
  )
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function loadInitialSessions(startsInJudgeMode: boolean) {
  const loaded = loadSessions()
  if (!startsInJudgeMode) {
    return loaded
  }

  const scenario = scenarios.find((item) => item.id === 'claims') ?? scenarios[0]
  return [createReplaySession(scenario, new Set(judgeDemoFailures)), ...loaded].slice(0, 8)
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
