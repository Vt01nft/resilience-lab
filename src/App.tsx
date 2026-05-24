import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Copy,
  Database,
  FileJson,
  Grid2X2,
  Lock,
  Mail,
  Network,
  Play,
  RadioTower,
  RefreshCw,
  Route,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Siren,
  UserRound,
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

const statusLabel: Record<StepStatus, string> = {
  pass: 'Healthy',
  warn: 'Degraded',
  fail: 'Down',
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
  mcp: Wrench,
  retrieval: Database,
  schema: FileJson,
  handoff: Users,
}

const navItems = [
  { label: 'Overview', icon: Grid2X2 },
  { label: 'Incidents', icon: AlertTriangle, active: true },
  { label: 'Replays', icon: CircleDot },
  { label: 'Agents', icon: Network },
  { label: 'Evaluations', icon: ClipboardCheck },
  { label: 'Dependencies', icon: Boxes },
  { label: 'Launch Gate', icon: Shield },
  { label: 'Alerts', icon: Bell },
  { label: 'Settings', icon: Settings },
]

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
  const activeFailures = new Set(activeSession.failures)
  const incidentCode =
    selectedScenario.id === 'incident'
      ? 'INC-2026-0524-1843'
      : selectedScenario.id === 'procurement'
        ? 'INC-2026-0524-2119'
        : 'INC-2026-0524-1432'

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
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
          </div>
          <strong>Resilience Lab</strong>
        </div>

        <button className="environment-select" type="button">
          <span />
          Prod
          <ChevronDown size={15} />
        </button>

        <nav className="nav-list" aria-label="Console navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button className={item.active ? 'active' : ''} type="button" key={item.label}>
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="security-card">
          <ShieldCheck size={22} />
          <strong>Enterprise Ready</strong>
          <span>SOC 2 • GDPR • HIPAA</span>
          <span>End-to-end replay evidence</span>
        </div>

        <div className="profile-card">
          <span>AV</span>
          <div>
            <strong>Alex V.</strong>
            <small>Platform Admin</small>
          </div>
          <ChevronDown size={15} />
        </div>
      </aside>

      <section className="console">
        <header className="incident-header">
          <div>
            <p className="crumbs">Incidents <span>/</span> {incidentCode}</p>
            <div className="title-row">
              <h1>{selectedScenario.title} failure</h1>
              <span className="env-pill">Production</span>
            </div>
            <p className="meta-line">
              May 24, 2026 <span>•</span> 14:32:11 UTC <span>•</span> 2m 47s <span>•</span>{' '}
              {activeSession.id.toLowerCase()}
            </p>
          </div>
          <div className="header-actions">
            <button type="button" onClick={copyReport}>
              <Share2 size={16} />
              {copyState === 'copied' ? 'Copied' : copyState === 'blocked' ? 'Copy blocked' : 'Share'}
            </button>
            <button type="button" onClick={downloadReport} data-testid="download-report">
              <ArrowDownToLine size={16} />
              Export
            </button>
            <button className="create-report" type="button" data-testid="judge-demo" onClick={startJudgeDemo}>
              Create Report
            </button>
          </div>
        </header>

        <section className="timeline-strip panel">
          <div className="play-stack">
            <button type="button" data-testid="run-replay" onClick={() => runReplay()} aria-label="Run replay">
              <Play size={18} />
            </button>
            <button type="button">1.0x</button>
          </div>
          <div className="incident-line">
            {allFailureKeys.map((key, index) => {
              const Icon = failureIcons[key]
              const active = activeFailures.has(key)
              return (
                <button
                  className={active ? 'active' : ''}
                  type="button"
                  data-testid={`failure-${key}`}
                  key={key}
                  onClick={() => toggleFailure(key)}
                >
                  <span>{timeForIndex(index)}</span>
                  <small>{failureLabels[key]}</small>
                  <i>
                    <Icon size={20} />
                  </i>
                </button>
              )
            })}
            <div className="recovered-dot">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="recovery-summary">
            <CheckCircle2 size={22} />
            <strong>{activeSession.ciGate.status === 'pass' ? 'Ready' : 'Recovered'}</strong>
            <span>14:35:02</span>
            <small>Total duration 2m 47s</small>
          </div>
        </section>

        <section className="scenario-row">
          {scenarios.map((scenario) => (
            <button
              className={scenario.id === scenarioId ? 'active' : ''}
              type="button"
              data-testid={`scenario-${scenario.id}`}
              key={scenario.id}
              onClick={() => {
                setScenarioId(scenario.id)
                setCopyState('idle')
              }}
            >
              <span>{scenario.market}</span>
              <strong>{scenario.title}</strong>
            </button>
          ))}
          <button className="chaos-button" type="button" data-testid="worst-case" onClick={runWorstCase}>
            <Zap size={16} />
            Worst case
          </button>
          <button className="healthy-button" type="button" onClick={resetHealthy}>
            <RefreshCw size={16} />
            Healthy replay
          </button>
        </section>

        <section className="dashboard-grid">
          <section className="panel event-log">
            <PanelHeader title="Event log" action="Filters" />
            <div className="event-list">
              {activeSession.timeline.slice(2).map((step, index) => {
                const Icon = statusIcon[step.status]
                return (
                  <article className={index === 0 ? 'selected' : ''} key={`${step.at}-${step.label}`}>
                    <span>{step.at.replace('00:', '14:3')}</span>
                    <Icon size={18} />
                    <div>
                      <strong>{step.label}</strong>
                      <small>{dependencyAlias(step.label)}</small>
                    </div>
                    <em>{index === activeSession.timeline.length - 3 ? '-' : `${(7.8 + index * 3.7).toFixed(1)}s`}</em>
                  </article>
                )
              })}
            </div>
            <button className="note-button" type="button">
              <Copy size={15} />
              Add Note
            </button>
          </section>

          <section className="panel trace-panel">
            <PanelHeader title="Trace replay" action="Legend" />
            <TraceReplay activeSession={activeSession} />
            <div className="detail-card">
              <div>
                <strong>{activeSession.timeline[2]?.label ?? 'Replay event'}</strong>
                <span>{activeSession.timeline[2]?.at ?? '00:01.118'}</span>
                <em>Error</em>
              </div>
              <dl>
                <dt>Agent</dt>
                <dd>{selectedScenario.operator.toLowerCase().replaceAll(' ', '-')}</dd>
                <dt>Impact</dt>
                <dd>{activeSession.estimatedLossAvoided}</dd>
                <dt>Recovery</dt>
                <dd>{selectedScenario.recoveryPlan}</dd>
              </dl>
            </div>
          </section>

          <section className="panel dependency-panel">
            <PanelHeader title="Dependency health" action="View all" />
            <div className="dependency-list">
              {activeSession.dependencyHealth.map((dependency, index) => {
                const Icon = healthIcon(index)
                return (
                  <article className={dependency.status} key={dependency.name}>
                    <Icon size={17} />
                    <strong>{dependency.name}</strong>
                    <Sparkline status={dependency.status} />
                    <span>{statusLabel[dependency.status]}</span>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="panel context-panel">
            <PanelHeader title="Incident context" />
            <dl>
              <dt>Agent</dt>
              <dd>{selectedScenario.title}</dd>
              <dt>Version</dt>
              <dd>1.8.3</dd>
              <dt>Environment</dt>
              <dd>Production</dd>
              <dt>User</dt>
              <dd>user_9d7f2c</dd>
              <dt>Channel</dt>
              <dd>Web</dd>
              <dt>Session ID</dt>
              <dd>{activeSession.id.toLowerCase()}</dd>
              <dt>Tags</dt>
              <dd>{selectedScenario.market.toLowerCase()}, resilient-agent</dd>
            </dl>
          </section>

          <section className="panel performance-panel">
            <PanelHeader title="Performance over time" />
            <PerformanceChart />
          </section>

          <section className="panel recovery-panel">
            <PanelHeader title="Recovery paths" />
            <div className="recovery-list">
              {activeSession.remediationTasks.slice(0, 3).map((task, index) => (
                <article key={task.title}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.priority === 'P0' ? 'Triggered' : 'Success'} +{(7.8 + index * 6.1).toFixed(1)}s</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={`panel launch-panel ${activeSession.ciGate.status}`}>
            <PanelHeader title="Launch gate" />
            <div className="gate-grid">
              <article className="blocked">
                <Lock size={22} />
                <strong>{activeSession.ciGate.status === 'pass' ? 'MONITORED' : 'BLOCKED'}</strong>
                <span>{activeSession.remediationTasks.length} open issues</span>
                <small>{activeSession.unsafePathsBlocked} unsafe paths blocked</small>
              </article>
              <Route size={26} />
              <article className="safe">
                <ShieldCheck size={25} />
                <strong>SAFE TO LAUNCH</strong>
                <span>{hardenedSession.score}/100 baseline</span>
                <small>{improvement > 0 ? `+${improvement} point recovery` : 'Reliability SLOs met'}</small>
              </article>
            </div>
            <button type="button" onClick={downloadReport}>
              View Gate Criteria
            </button>
          </section>

          <section className="panel report-panel">
            <PanelHeader title="Evidence report" action="JSON" />
            <pre>{activeSession.report}</pre>
          </section>

          <section className="panel readiness-panel">
            <PanelHeader title="Submission readiness" />
            <div className="readiness-steps">
              {['Show the break', 'Prove safe behavior', 'Export the artifact', 'Switch scenarios'].map((step) => (
                <article key={step}>
                  <CheckCircle2 size={17} />
                  <span>{step}</span>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

function PanelHeader({ title, action }: { title: string; action?: string }) {
  return (
    <header className="panel-header">
      <h2>{title}</h2>
      {action ? <button type="button">{action}</button> : null}
    </header>
  )
}

function TraceReplay({ activeSession }: { activeSession: ReplaySession }) {
  return (
    <div className="trace-replay">
      <div className="trace-label user">
        <UserRound size={17} />
        <span>User Request</span>
      </div>
      <div className="trace-label recovery">
        <CheckCircle2 size={20} />
        <span>Recovery<br />Fallback + human</span>
      </div>
      <svg viewBox="0 0 720 280" role="img" aria-label="Agent trace replay">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path className="bad-path" d="M80 140 C160 20 160 40 230 42 L560 42 C590 42 590 140 640 140" />
        <path className="good-path" d="M80 140 C170 100 190 95 260 96 L560 96 C590 96 600 140 640 140" />
        <path className="good-path" d="M80 140 C170 150 190 160 260 160 L560 160 C590 160 600 140 640 140" />
        <path className="good-path" d="M80 140 C170 215 190 220 260 220 L560 220 C590 220 600 140 640 140" />
        {[80, 190, 300, 410, 520, 640].map((x) => (
          <circle className="node good" cx={x} cy={140} r="7" key={`mid-${x}`} />
        ))}
        {[190, 300, 410, 520].map((x) => (
          <circle className="node good" cx={x} cy={96} r="7" key={`top-${x}`} />
        ))}
        {[190, 300, 410, 520].map((x) => (
          <circle className="node good" cx={x} cy={160} r="7" key={`low-${x}`} />
        ))}
        {[190, 300, 410, 520].map((x) => (
          <circle className="node good" cx={x} cy={220} r="7" key={`base-${x}`} />
        ))}
        {activeSession.failures.slice(0, 5).map((failure, index) => {
          const Icon = failureIcons[failure]
          const x = 170 + index * 92
          return (
            <foreignObject x={x} y="25" width="44" height="44" key={failure}>
              <div className="svg-icon">
                <Icon size={20} />
              </div>
            </foreignObject>
          )
        })}
        <line className="cursor-line" x1="360" x2="360" y1="0" y2="270" />
        <circle className="recovery-node" cx="640" cy="140" r="17" filter="url(#glow)" />
      </svg>
    </div>
  )
}

function Sparkline({ status }: { status: StepStatus }) {
  const stroke = status === 'pass' || status === 'recover' ? '#98d36d' : status === 'warn' ? '#ff9f2e' : '#ff554d'
  return (
    <svg className="sparkline" viewBox="0 0 120 24" aria-hidden="true">
      <polyline
        points="0,14 8,13 16,16 24,10 32,13 40,9 48,17 56,12 64,15 72,8 80,16 88,11 96,13 104,10 112,14 120,12"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  )
}

function PerformanceChart() {
  return (
    <svg className="performance-chart" viewBox="0 0 620 210" role="img" aria-label="Performance over time">
      {[0, 1, 2, 3].map((line) => (
        <line x1="0" x2="620" y1={30 + line * 45} y2={30 + line * 45} key={line} />
      ))}
      <polyline
        className="success"
        points="0,58 40,54 80,63 120,70 160,82 200,84 240,88 280,92 320,64 360,58 400,62 440,57 480,61 520,60 560,56 620,59"
      />
      <polyline
        className="latency"
        points="0,138 45,130 90,142 135,128 180,136 225,125 270,139 315,132 360,138 405,126 450,136 495,131 540,140 585,127 620,135"
      />
      <polyline
        className="errors"
        points="0,178 60,175 120,180 180,172 240,176 285,168 315,74 345,168 390,176 450,174 510,179 570,176 620,178"
      />
    </svg>
  )
}

function healthIcon(index: number) {
  return [RadioTower, Database, Database, Wrench, Users, Mail][index] ?? Activity
}

function dependencyAlias(label: string) {
  if (label.toLowerCase().includes('model')) return 'gpt-4o'
  if (label.toLowerCase().includes('mcp')) return 'payments_refund'
  if (label.toLowerCase().includes('retriever') || label.toLowerCase().includes('evidence')) return 'kb://policy-refunds'
  if (label.toLowerCase().includes('schema')) return 'response_validation'
  if (label.toLowerCase().includes('handoff')) return 'human_support'
  if (label.toLowerCase().includes('unsafe')) return 'guardrail'
  return 'fallback + human'
}

function timeForIndex(index: number) {
  return ['14:32:18', '14:32:47', '14:33:21', '14:33:59', '14:34:32'][index] ?? '14:35:02'
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
