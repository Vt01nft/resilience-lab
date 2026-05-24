import {
  AlertTriangle,
  ArrowDownToLine,
  Copy,
  Database,
  FileJson,
  Gauge,
  GitBranch,
  Play,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
  const [toast, setToast] = useState('')

  const selectedScenario = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0]
  const previewSession = useMemo(
    () => createReplaySession(selectedScenario, failures),
    [failures, selectedScenario],
  )
  const activeSession = sessions[0] ?? previewSession
  const failedDependencies = activeSession.dependencyHealth.filter((dependency) => dependency.status !== 'pass')

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
    <main className="product-shell">
      <aside className="app-nav">
        <div className="brand">
          <img src="/resilience-lab-logo.svg" alt="" />
          <div>
            <strong>Resilience Lab</strong>
            <span>Agent flight recorder</span>
          </div>
        </div>

        <nav>
          {['Overview', 'Replay Lab', 'Launch Gate', 'Reports'].map((item) => (
            <button className={item === 'Replay Lab' ? 'active' : ''} type="button" key={item}>
              {item}
            </button>
          ))}
        </nav>

        <div className="nav-card">
          <ShieldCheck size={20} />
          <strong>TrueFoundry fit</strong>
          <span>Resilient agents under model, MCP, retrieval, and handoff failures.</span>
        </div>
      </aside>

      <section className="main-stage">
        <a className="floating-logo" href="https://github.com/Vt01nft/resilience-lab" target="_blank" aria-label="Open GitHub repository">
          <span className="logo-ring" />
          <img src="/resilience-lab-logo.svg" alt="" />
        </a>

        <header className="topbar">
          <div>
            <p>Production replay</p>
            <h1>Agent resilience command center</h1>
          </div>
          <div className="top-actions">
            <a href="https://github.com/Vt01nft/resilience-lab" target="_blank">
              <GitBranch size={17} />
              GitHub
            </a>
            <button type="button" onClick={copyReport}>
              <Copy size={17} />
              {copyState === 'copied' ? 'Copied' : 'Share'}
            </button>
            <button type="button" onClick={downloadReport} data-testid="download-report">
              <ArrowDownToLine size={17} />
              Export
            </button>
          </div>
        </header>

        <section className="hero-console">
          <div className="hero-copy">
            <p className="eyebrow">Before agents reach users</p>
            <h2>Prove how your AI agent recovers when the stack breaks.</h2>
            <p>
              Inject realistic failures, replay the incident, block unsafe output, score launch readiness,
              and export the evidence.
            </p>
            <div className="hero-actions">
              <button className="primary" type="button" data-testid="judge-demo" onClick={startJudgeDemo}>
                <Sparkles size={18} />
                Start judge demo
              </button>
              <button type="button" onClick={() => captureReplay()} data-testid="run-replay">
                <Play size={18} />
                Capture replay
              </button>
              <button className="danger" type="button" data-testid="worst-case" onClick={runWorstCase}>
                <Zap size={18} />
                Worst case
              </button>
            </div>
          </div>

          <div className="score-orb">
            <div className="orb-ring" />
            <span>Resilience score</span>
            <strong>{activeSession.score}</strong>
            <small>{activeSession.readiness}</small>
          </div>
        </section>

        <section className="metrics-grid">
          <Metric icon={AlertTriangle} label="Active failures" value={String(activeSession.failures.length)} detail={activeSession.failures.map((key) => failureLabels[key]).join(', ') || 'None'} />
          <Metric icon={ShieldCheck} label="Unsafe paths blocked" value={String(activeSession.unsafePathsBlocked)} detail="Unsupported answers never reach the user." />
          <Metric icon={Gauge} label="Launch gate" value={activeSession.ciGate.status === 'pass' ? 'Allowed' : 'Blocked'} detail={activeSession.ciGate.summary} />
          <Metric icon={Terminal} label="Evidence" value="Exportable" detail="JSON report, timeline, checks, and remediation." />
        </section>

        <section className="workflow">
          <section className="panel span-7">
            <PanelTitle kicker="Step 1" title="Choose a high-stakes agent" />
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

          <section className="panel span-5">
            <PanelTitle kicker="Step 2" title="Inject failure modes" />
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
                    <Icon size={19} />
                    <span>{failureLabels[key]}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel span-8">
            <PanelTitle kicker="Step 3" title="Replay timeline" />
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

          <section className="panel span-4">
            <PanelTitle kicker="Step 4" title="Launch gate" />
            <div className={`gate-card ${activeSession.ciGate.status}`}>
              <ShieldCheck size={28} />
              <strong>{activeSession.ciGate.status === 'pass' ? 'Safe to launch' : 'Release blocked'}</strong>
              <p>{activeSession.ciGate.summary}</p>
            </div>
            <div className="dependency-stack">
              {(failedDependencies.length ? failedDependencies : activeSession.dependencyHealth.slice(0, 3)).map((dependency) => (
                <article className={dependency.status} key={dependency.name}>
                  <span>{dependency.name}</span>
                  <strong>{statusLabel[dependency.status]}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="panel span-12">
            <PanelTitle kicker="Step 5" title="Export evidence report" />
            <pre>{activeSession.report}</pre>
            <div className="report-actions">
              <button type="button" data-testid="copy-report" onClick={copyReport}>
                <Copy size={18} />
                {copyState === 'copied' ? 'Copied' : copyState === 'blocked' ? 'Copy blocked' : 'Copy report'}
              </button>
              <button type="button" onClick={downloadReport}>
                <ArrowDownToLine size={18} />
                Download JSON
              </button>
              <button type="button" onClick={resetHealthy}>
                <RefreshCw size={18} />
                Healthy baseline
              </button>
            </div>
          </section>
        </section>

        {toast ? <div className="toast" role="status">{toast}</div> : null}
      </section>
    </main>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof AlertTriangle
  label: string
  value: string
  detail: string
}) {
  return (
    <article>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function PanelTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="panel-title">
      <span>{kicker}</span>
      <h3>{title}</h3>
    </header>
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
