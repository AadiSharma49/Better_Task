import { useCallback, useEffect, useState } from 'react'
import './App.css'

type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  owner: string
  due_date: string | null
  created_at: string
  updated_at: string
}

type DashboardSummary = {
  total_tasks: number
  overdue_tasks: number
  done_tasks: number
  in_progress_tasks: number
  blocked_tasks: number
}

type TaskForm = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  owner: string
  due_date: string
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const initialForm: TaskForm = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium',
  owner: '',
  due_date: '',
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
]

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(errorBody?.message ?? 'Request failed.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function apiUrl(path: string): string {
  if (!apiBaseUrl) {
    return path
  }

  return `${apiBaseUrl}${path}`
}

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return 'No due date'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue))
}

function humanizeLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [summary, setSummary] = useState<DashboardSummary>({
    total_tasks: 0,
    overdue_tasks: 0,
    done_tasks: 0,
    in_progress_tasks: 0,
    blocked_tasks: 0,
  })
  const [form, setForm] = useState<TaskForm>(initialForm)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string>('Loading tasks...')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const query = new URLSearchParams()

      if (statusFilter !== 'all') {
        query.set('status', statusFilter)
      }

      if (priorityFilter !== 'all') {
        query.set('priority', priorityFilter)
      }

      const [tasksResponse, summaryResponse] = await Promise.all([
        readJson<Task[]>(apiUrl(`/api/tasks${query.size > 0 ? `?${query.toString()}` : ''}`)),
        readJson<DashboardSummary>(apiUrl('/api/dashboard')),
      ])

      setTasks(tasksResponse)
      setSummary(summaryResponse)
      setStatusMessage(
        tasksResponse.length === 0
          ? 'No tasks match the current filters yet.'
          : `${tasksResponse.length} tasks loaded.`,
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load tasks.')
      setStatusMessage('We could not reach the backend API.')
    } finally {
      setIsLoading(false)
    }
  }, [priorityFilter, statusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function resetForm() {
    setForm(initialForm)
    setEditingTaskId(null)
    setErrorMessage('')
    setStatusMessage('Ready for the next task.')
  }

  function beginEdit(task: Task) {
    setEditingTaskId(task.id)
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      owner: task.owner,
      due_date: task.due_date ?? '',
    })
    setStatusMessage(`Editing "${task.title}".`)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const payload = {
      ...form,
      owner: form.owner.trim() || 'Unassigned',
      due_date: form.due_date || null,
    }

    try {
      if (editingTaskId === null) {
        await readJson<Task>(apiUrl('/api/tasks'), {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setStatusMessage('Task created successfully.')
      } else {
        await readJson<Task>(apiUrl(`/api/tasks/${editingTaskId}`), {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setStatusMessage('Task updated successfully.')
      }

      resetForm()
      await loadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save the task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(taskId: number) {
    setErrorMessage('')

    try {
      await readJson<void>(apiUrl(`/api/tasks/${taskId}`), { method: 'DELETE' })

      if (editingTaskId === taskId) {
        resetForm()
      }

      setStatusMessage('Task deleted successfully.')
      await loadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete the task.')
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero__content">
          <div className="hero__eyebrow">Assessment-ready task tracker</div>
          <h1 className="hero__title">Track work without losing the thread.</h1>
          <p className="hero__subtitle">
            Pulseboard is a compact execution dashboard for small teams. It keeps task states
            strict, surfaces blocked work quickly, and gives the reviewer a clear view of
            validation, API design, observability, and frontend structure.
          </p>
          <div className="hero__meta">
            <span>Flask API + SQLite</span>
            <span>React + TypeScript</span>
            <span>Validation, tests, and walkthrough-ready docs</span>
          </div>
        </div>
      </section>

      <section className="board">
        <div className="form-panel panel">
          <div className="panel__header">
            <div>
              <h2>{editingTaskId === null ? 'Create task' : 'Edit task'}</h2>
              <p>Define ownership, urgency, and due dates up front.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Prepare backend validation tests"
                required
                minLength={3}
              />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Capture why this task matters and what done looks like."
              />
            </div>

            <div className="field field--split">
              <div className="field">
                <label htmlFor="owner">Owner</label>
                <input
                  id="owner"
                  value={form.owner}
                  onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Aarav"
                />
              </div>

              <div className="field">
                <label htmlFor="dueDate">Due date</label>
                <input
                  id="dueDate"
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, due_date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="field field--split">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="field__hint">
              Business rule: once a task is marked done, the API prevents moving it back into an
              active state.
            </p>
            <p className="inline-error">{errorMessage}</p>
            <p className="status-message">{statusMessage}</p>

            <div className="button-row">
              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingTaskId === null
                    ? 'Create task'
                    : 'Save changes'}
              </button>
              <button className="button button--secondary" type="button" onClick={resetForm}>
                Clear form
              </button>
            </div>
          </form>
        </div>

        <div className="tasks-panel panel">
          <div className="stats-grid">
            <article className="stat-card">
              <span>Total tasks</span>
              <strong>{summary.total_tasks}</strong>
            </article>
            <article className="stat-card">
              <span>In progress</span>
              <strong>{summary.in_progress_tasks}</strong>
            </article>
            <article className="stat-card">
              <span>Blocked</span>
              <strong>{summary.blocked_tasks}</strong>
            </article>
            <article className="stat-card">
              <span>Overdue</span>
              <strong>{summary.overdue_tasks}</strong>
            </article>
          </div>

          <div className="panel__header">
            <div>
              <h3>Task board</h3>
              <p>Filter the list without losing the dashboard summary.</p>
            </div>
            <button className="button button--ghost" type="button" onClick={() => void loadData()}>
              Refresh
            </button>
          </div>

          <div className="filters">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All priorities</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="empty-state">Loading task data...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              No tasks found. Start by creating one on the left to populate the board.
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article key={task.id} className="task-card">
                  <div className="task-card__top">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description || 'No extra notes yet.'}</p>
                    </div>
                    <div className="task-card__actions">
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={() => beginEdit(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => void handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="pill-row">
                    <span className="pill" data-tone={task.status}>
                      {humanizeLabel(task.status)}
                    </span>
                    <span className="pill" data-tone={task.priority}>
                      {humanizeLabel(task.priority)}
                    </span>
                  </div>

                  <div className="task-card__bottom">
                    <div className="task-card__meta">
                      <span>Owner: {task.owner}</span>
                      <span>Due: {formatDate(task.due_date)}</span>
                    </div>
                    <div className="task-card__meta">
                      <span>Updated {formatDate(task.updated_at)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
