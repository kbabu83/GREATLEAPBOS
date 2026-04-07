import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { CreateTaskModal } from './CreateTaskModal';

// ── helpers ───────────────────────────────────────────────────────────────────
const taskNum   = id => `#TASK-${String(id).padStart(4, '0')}`;
const fmtDate   = d  => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : null;
const toYMD     = d  => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const pad       = n  => String(n).padStart(2, '0');
const sameDay   = (a,b) => a && b && toYMD(a) === toYMD(b);
const nanoid    = ()  => Math.random().toString(36).slice(2) + Date.now().toString(36);
const fmtElapsed = s  => `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`;
const fmtMins   = m  => m < 60 ? `${m}m` : m % 60 === 0 ? `${m/60}h` : `${Math.floor(m/60)}h ${m%60}m`;

// ── New utility functions for logged time and detailed status ────────────────
const getTotalLoggedMins = (task) => {
  // Try timeLogs first (new format)
  if (task.timeLogs && Array.isArray(task.timeLogs)) {
    return task.timeLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  }
  // Fallback for time_logs (if API returns different format)
  if (task.time_logs && Array.isArray(task.time_logs)) {
    return task.time_logs.reduce((sum, log) => sum + (log.duration_minutes || log.duration || 0), 0);
  }
  // Fallback to time_logs_count if available (total minutes)
  if (task.time_logs_count && typeof task.time_logs_count === 'number') {
    return task.time_logs_count;
  }
  return 0;
};

const formatLoggedTime = (mins) => {
  if (mins === 0) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const getDetailedCompletionStatus = (task) => {
  if (task.status !== 'completed') return null;
  if (!task.completed_at || !task.due_date) return 'Completed';
  const completed = new Date(task.completed_at);
  const due = new Date(task.due_date);
  if (completed <= due) {
    const daysEarly = Math.floor((due - completed) / (1000 * 60 * 60 * 24));
    return daysEarly === 0 ? 'Completed on time' : `Completed ${daysEarly} day${daysEarly !== 1 ? 's' : ''} early`;
  } else {
    const daysLate = Math.floor((completed - due) / (1000 * 60 * 60 * 24));
    return `Completed ${daysLate} day${daysLate !== 1 ? 's' : ''} late`;
  }
};

const getDueDateInfo = (task) => {
  if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return null;
  const now = new Date();
  const due = new Date(task.due_date);
  const daysLeft = Math.floor((due - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) {
    return `Overdue ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`;
  } else if (daysLeft === 0) {
    return 'Due today';
  } else {
    return `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  }
};

const getStatusLabel = (task) => {
  const baseStatus = STATUS_LABEL[task.status] || task.status;
  const detailedCompletion = getDetailedCompletionStatus(task);
  const dueInfo = getDueDateInfo(task);
  if (detailedCompletion) return detailedCompletion;
  if (dueInfo) return dueInfo;
  return baseStatus;
};

const PRIORITY_ORD = { urgent: 4, high: 3, medium: 2, low: 1 };
const PRIORITY_DOT = { urgent: 'dark:bg-red-500 bg-red-600', high: 'dark:bg-orange-500 bg-orange-600', medium: 'dark:bg-yellow-400 bg-yellow-500', low: 'dark:bg-gray-300 bg-gray-400' };
const PRIORITY_CLS = { urgent: 'text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900/50', high: 'text-orange-600 bg-orange-50 border border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-900/50', medium: 'text-yellow-600 bg-yellow-50 border border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/40 dark:border-yellow-900/50', low: 'text-slate-600 bg-slate-100 border border-slate-300 dark:text-slate-400 dark:bg-slate-900/40 dark:border-slate-800/50' };
const STATUS_ORD   = { in_progress: 3, pending: 2, completed: 1, cancelled: 0 };
// "pending" is shown as "Not Started" throughout the UI — no DB change required
const STATUS_CLS   = { pending: 'text-slate-600 bg-slate-100 border border-slate-300 dark:text-slate-400 dark:bg-slate-900/40 dark:border-slate-800/50', in_progress: 'text-teal-600 bg-teal-50 border border-teal-200 dark:text-teal-400 dark:bg-teal-950/40 dark:border-teal-900/50', completed: 'text-green-600 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-950/40 dark:border-green-900/50', cancelled: 'text-slate-600 bg-slate-100 border border-slate-300 dark:text-slate-400 dark:bg-slate-900/40 dark:border-slate-800/50' };
const STATUS_LABEL = { pending: 'Not Started', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

const BLOCK_COLORS = [
  { bg:'bg-blue-900/50',    border:'border-blue-700/70',    text:'text-blue-300',    bar:'bg-blue-500'    },
  { bg:'bg-violet-900/50',  border:'border-violet-700/70',  text:'text-violet-300',  bar:'bg-violet-500'  },
  { bg:'bg-emerald-900/50', border:'border-emerald-700/70', text:'text-emerald-300', bar:'bg-emerald-500' },
  { bg:'bg-amber-900/50',   border:'border-amber-700/70',   text:'text-amber-300',   bar:'bg-amber-500'   },
  { bg:'bg-rose-900/50',    border:'border-rose-700/70',    text:'text-rose-300',    bar:'bg-rose-500'    },
  { bg:'bg-cyan-900/50',    border:'border-cyan-700/70',    text:'text-cyan-300',    bar:'bg-cyan-500'    },
  { bg:'bg-fuchsia-900/50', border:'border-fuchsia-700/70', text:'text-fuchsia-300', bar:'bg-fuchsia-500' },
  { bg:'bg-lime-900/50',    border:'border-lime-700/70',    text:'text-lime-300',    bar:'bg-lime-500'    },
];
const blockColor = id => BLOCK_COLORS[Number(id) % BLOCK_COLORS.length];

// ── Planner storage ───────────────────────────────────────────────────────────
const STORE_KEY   = 'gl_task_planner_v2';
const TIMER_KEY   = 'gl_task_timer_v1';
const loadBlocks  = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); } catch { return []; } };
const persistBlocks = b => localStorage.setItem(STORE_KEY, JSON.stringify(b));
const loadTimer   = () => { try { return JSON.parse(localStorage.getItem(TIMER_KEY)||'null'); } catch { return null; } };
const persistTimer = t => t ? localStorage.setItem(TIMER_KEY, JSON.stringify(t)) : localStorage.removeItem(TIMER_KEY);

// View hours
const DEFAULT_START = 9;
const DEFAULT_END   = 18; // exclusive — shows 9:00 → 18:00
const FULL_START    = 7;
const FULL_END      = 22;
const COL_PX        = 120; // px per hour

function getWeekDays(ref) {
  const d = new Date(ref);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({length:7}, (_,i) => { const x = new Date(d); x.setDate(x.getDate()+i); return x; });
}
function getMonthMatrix(ref) {
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last  = new Date(ref.getFullYear(), ref.getMonth()+1, 0);
  const startDow = first.getDay() === 0 ? 6 : first.getDay()-1;
  const days = Array.from({length: startDow}, () => null);
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(ref.getFullYear(), ref.getMonth(), i));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const WEEK_LABELS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Live Timer hook ───────────────────────────────────────────────────────────
function useTimer() {
  const [timer, setTimer] = useState(() => loadTimer()); // { taskId, taskTitle, startedAt (ISO), accSecs }
  const intervalRef = useRef(null);
  const [elapsed, setElapsed] = useState(0); // seconds since startedAt

  useEffect(() => {
    persistTimer(timer);
    if (timer && !timer.paused) {
      const tick = () => {
        const base = timer.accSecs || 0;
        setElapsed(base + Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else if (timer?.paused) {
      setElapsed(timer.accSecs || 0);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer]);

  const startTask = (task) => {
    setTimer({ taskId: task.id, taskTitle: task.title, startedAt: new Date().toISOString(), accSecs: 0, paused: false });
  };

  const pauseTask = async () => {
    if (!timer || timer.paused) return;
    const secs = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
    const total = (timer.accSecs || 0) + secs;
    // Log time to API (fire and forget)
    try {
      await api.post(`/tenant/execution/tasks/${timer.taskId}/time-logs`, {
        start_time: timer.startedAt,
        end_time:   new Date().toISOString(),
        notes:      'Auto-logged via timer',
      });
    } catch { /* silent */ }
    setTimer(t => ({ ...t, accSecs: total, paused: true }));
  };

  const resumeTask = () => {
    setTimer(t => ({ ...t, startedAt: new Date().toISOString(), paused: false }));
  };

  const stopTask = async () => {
    if (timer && !timer.paused) {
      try {
        await api.post(`/tenant/execution/tasks/${timer.taskId}/time-logs`, {
          start_time: timer.startedAt,
          end_time:   new Date().toISOString(),
          notes:      'Auto-logged via timer',
        });
      } catch { /* silent */ }
    }
    setTimer(null);
    setElapsed(0);
  };

  return { timer, elapsed, startTask, pauseTask, resumeTask, stopTask };
}

// ── Active Timer Bar ──────────────────────────────────────────────────────────
function TimerBar({ timer, elapsed, onPause, onResume, onStop, onNavigate, isVisible }) {
  if (!timer || !isVisible) return null;
  const isPaused = timer.paused;
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${isPaused ? 'bg-amber-950/40 border-amber-900/50' : 'bg-teal-950/40 border-teal-900/50'}`}>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isPaused ? 'bg-amber-400' : 'bg-teal-400 animate-pulse'}`} />
      <div className="flex-1 min-w-0">
        <span className={`font-semibold ${isPaused ? 'text-amber-400' : 'text-teal-400'}`}>
          {isPaused ? 'Paused' : 'Running'}: </span>
        <span className="text-slate-300 truncate">{timer.taskTitle}</span>
      </div>
      <span className={`font-mono font-bold text-base tabular-nums ${isPaused ? 'text-amber-400' : 'text-teal-400'}`}>
        {fmtElapsed(elapsed)}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isPaused ? (
          <button onClick={onResume}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            ▶ Resume
          </button>
        ) : (
          <button onClick={onPause}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
            ⏸ Pause
          </button>
        )}
        <button onClick={onStop}
          className="px-3 py-1.5 text-xs border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 font-medium">
          Stop
        </button>
        <button onClick={() => onNavigate(timer.taskId)}
          className="px-3 py-1.5 text-xs border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50">
          View →
        </button>
      </div>
    </div>
  );
}

// ── Block Modal ───────────────────────────────────────────────────────────────
function BlockModal({ open, initial, allTasks, onSave, onDelete, onClose }) {
  const blank = { taskId:'', date: toYMD(new Date()), startHour: 9, startMinute: 0, durationMins: 15, note: '' };
  const [form, setForm] = useState(blank);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : blank);
  }, [open, initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const task = allTasks.find(t => String(t.id) === String(form.taskId));

  const handleSave = () => {
    if (!form.taskId) return alert('Please select a task');
    const dur = Math.max(1, Number(form.durationMins));
    const block = {
      id:           isEdit ? form.id : nanoid(),
      taskId:       Number(form.taskId),
      taskTitle:    task?.title || '',
      taskNum:      taskNum(form.taskId),
      taskPriority: task?.priority || 'medium',
      date:         form.date,
      startHour:    Number(form.startHour),
      startMinute:  Number(form.startMinute),
      durationMins: dur,
      note:         form.note,
    };
    onSave(block);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isEdit?'Edit':'Create'} Block</h2>
          <button onClick={onClose} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Task</label>
            <select value={form.taskId} onChange={e => set('taskId', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select a task…</option>
              {allTasks.map(t => (
                <option key={t.id} value={t.id}>{taskNum(t.id)} · {t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Start Hour</label>
              <input type="number" min="0" max="23" value={form.startHour} onChange={e => set('startHour', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Start Min</label>
              <input type="number" min="0" max="59" step="15" value={form.startMinute} onChange={e => set('startMinute', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Duration (min)</label>
              <input type="number" min="1" value={form.durationMins} onChange={e => set('durationMins', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Note</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="Add any notes…" rows="2"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 dark:border-slate-700/50">
          {isEdit && (
            <button onClick={() => { onDelete(form.id); onClose(); }}
              className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 font-medium">
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 font-medium">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            {isEdit?'Save':'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Planner ───────────────────────────────────────────────────────────────────
function PlannerView({ blocks, onAddBlock, onEditBlock, allTasks, plannerMode, setPlannerMode, plannerDate, setPlannerDate, isTeamView }) {
  const [expanded, setExpanded] = useState(true);

  const durLabel = m => m < 60 ? `${m}m` : `${Math.floor(m/60)}h`;
  const blockLeft = b => (b.startHour - (expanded ? FULL_START : DEFAULT_START)) * COL_PX + (b.startMinute / 60) * COL_PX;
  const blockWidth = b => (b.durationMins / 60) * COL_PX;

  // DayView
  const DayView = () => {
    const dayYMD = toYMD(plannerDate);

    // For team view, show task blocks from allTasks instead of localStorage blocks
    let dayBlocks = [];
    if (isTeamView) {
      // Get all tasks for this day (could be from team members)
      dayBlocks = allTasks
        .filter(t => t.due_date && toYMD(new Date(t.due_date)) === dayYMD)
        .sort((a,b) => (a.id || 0) - (b.id || 0));
    } else {
      dayBlocks = blocks.filter(b => b.date === dayYMD).sort((a,b) => a.startHour*60+a.startMinute - (b.startHour*60+b.startMinute));
    }

    const viewStart = expanded ? FULL_START : DEFAULT_START;
    const viewEnd   = expanded ? FULL_END : DEFAULT_END;
    const hours = Array.from({length: viewEnd - viewStart}, (_,i) => viewStart + i);
    const timelineWidth = (viewEnd - viewStart) * COL_PX;

    const plannedMins = dayBlocks.reduce((sum, b) => {
      if (isTeamView) {
        return sum + (getTotalLoggedMins(b) || 0);
      } else {
        return sum + (b.durationMins || 0);
      }
    }, 0);

    // Group blocks into lanes
    const lanes = [];
    if (!isTeamView) {
      dayBlocks.forEach(b => {
        let placed = false;
        for (let lane of lanes) {
          const overlap = lane.some(lb => {
            const bStart = b.startHour + b.startMinute/60;
            const bEnd = bStart + b.durationMins/60;
            const lStart = lb.startHour + lb.startMinute/60;
            const lEnd = lStart + lb.durationMins/60;
            return !(bEnd <= lStart || bStart >= lEnd);
          });
          if (!overlap) { lane.push(b); placed = true; break; }
        }
        if (!placed) lanes.push([b]);
      });
    } else {
      // For team view, just show tasks vertically
      dayBlocks.forEach((b, idx) => lanes.push([b]));
    }

    return (
      <div className="flex border-t border-gray-200 dark:border-slate-700/30 overflow-x-auto">
        <div className="flex-1">
          <div className="relative border-b border-gray-200 dark:border-slate-700/20 bg-gray-50 dark:bg-slate-800/20 py-2 px-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-300">{new Date(plannerDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
          </div>

          {/* Hour headers */}
          <div className="relative border-b border-gray-200 dark:border-slate-700/20 bg-gray-100 dark:bg-slate-800/30"
            style={{minWidth: timelineWidth + 'px', display:'flex'}}>
            {hours.map(h => (
              <div key={h} className="flex-1 text-center py-2 border-r border-gray-200 dark:border-slate-700/20 text-xs font-medium text-gray-700 dark:text-slate-400">
                {pad(h)}:00
              </div>
            ))}
          </div>

          {/* Add row — only show for My Tasks */}
          {!isTeamView && (
            <div className="relative border-b border-gray-200 dark:border-slate-700/20 cursor-pointer group"
              style={{minWidth: timelineWidth + 'px', height: '36px'}}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickedHour = Math.floor(clickX / COL_PX) + viewStart;
                const clickedMin  = Math.floor(((clickX % COL_PX) / COL_PX) * 60 / 15) * 15;
                onAddBlock({ date: dayYMD, startHour: Math.min(clickedHour, viewEnd-1), startMinute: clickedMin });
              }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-600 dark:text-slate-400 bg-gray-200 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700/50 rounded px-2 py-0.5">+ Click to add block</span>
              </div>
              {/* Hour grid lines */}
              {hours.map(h => (
                <div key={h} className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-slate-700/20"
                  style={{left: (h - viewStart + 1) * COL_PX + 'px'}} />
              ))}
            </div>
          )}

          {/* Task lanes */}
          {lanes.map((lane, laneIdx) => (
            <div key={laneIdx} className="relative border-b border-gray-200 dark:border-slate-700/20"
              style={{minWidth: timelineWidth + 'px', height: '52px'}}>
              {/* Hour grid lines */}
              {hours.map(h => (
                <div key={h} className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-slate-700/20"
                  style={{left: (h - viewStart + 1) * COL_PX + 'px'}} />
              ))}
              {/* Task blocks */}
              {lane.map(b => {
                let left, width, bc, loggedMins;

                if (isTeamView) {
                  // For team view: show task card with logged time
                  bc = blockColor(b.id);
                  loggedMins = getTotalLoggedMins(b);
                  left = 0;
                  width = timelineWidth;
                } else {
                  // For my tasks: show scheduled block
                  const task = allTasks.find(t => t.id === b.taskId);
                  left = blockLeft(b);
                  width = blockWidth(b);
                  bc = blockColor(b.taskId);
                  loggedMins = task ? getTotalLoggedMins(task) : 0;
                }

                return (
                  <div key={b.id}
                    onClick={e => {
                      if (!isTeamView) {
                        e.stopPropagation();
                        onEditBlock(b);
                      }
                    }}
                    className={`absolute top-1.5 bottom-1.5 rounded-lg border overflow-hidden flex flex-col justify-center px-2 ${
                      isTeamView
                        ? `${bc.bg} ${bc.border} ${bc.text} opacity-80 cursor-default`
                        : `${bc.bg} ${bc.border} ${bc.text} cursor-pointer hover:opacity-80 transition-opacity`
                    }`}
                    style={{ left: left + 'px', width: width + 'px' }}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1 h-full rounded-sm flex-shrink-0 ${bc.bar} opacity-70`} style={{width:'3px',minWidth:'3px',height:'calc(100% - 4px)'}} />
                      <span className="font-mono text-[10px] font-bold flex-shrink-0">{isTeamView ? taskNum(b.id) : b.taskNum}</span>
                      {width > 90 && <span className="text-[11px] font-medium truncate flex-1">{b.title || b.taskTitle}</span>}
                      {!isTeamView && width > 60 && <span className="text-[10px] opacity-60 flex-shrink-0">{durLabel(b.durationMins)}</span>}
                    </div>
                    {loggedMins > 0 && (
                      <div className="text-[11px] text-amber-300 font-bold mt-1">
                        Logged: {formatLoggedTime(loggedMins)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Left sidebar with day info */}
        <div className="w-24 flex-shrink-0 border-l border-slate-700/30 bg-slate-700/10 py-3 px-2 text-center space-y-1">
          <p className="text-xs text-slate-400 font-semibold">Scheduled</p>
          <p className="text-lg font-bold text-teal-400">{fmtMins(plannedMins)}</p>
          <p className="text-[10px] text-slate-500">{dayBlocks.length} {isTeamView ? 'tasks' : 'blocks'}</p>
        </div>
      </div>
    );
  };

  // WeekView
  const WeekView = () => {
    const weekDays = getWeekDays(plannerDate);
    const dayWidth = 140;
    const timelineHeight = 200;

    return (
      <div className="flex flex-col border-t border-gray-200 dark:border-slate-700/30">
        <div className="flex border-b border-gray-200 dark:border-slate-700/20 bg-gray-100 dark:bg-slate-800/30" style={{minWidth: `${dayWidth*7}px`}}>
          {weekDays.map(d => {
            const dayYMD = toYMD(d);
            const isToday = sameDay(d, new Date());
            return (
              <div key={d.toISOString()} className="flex-1 text-center py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700/30 border-r border-gray-200 dark:border-slate-700/20 transition-colors"
                onClick={() => { setPlannerDate(d); setPlannerMode('day'); }}>
                <p className={`text-xs font-semibold ${isToday ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-slate-400'}`}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d.getDay()]}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-teal-700 dark:text-teal-300' : 'text-gray-900 dark:text-slate-300'}`}>{d.getDate()}</p>
              </div>
            );
          })}
        </div>
        <div className="flex text-sm divide-x divide-gray-200 dark:divide-slate-700/20 h-56 overflow-x-auto">
          {weekDays.map(d => {
            const dayYMD = toYMD(d);
            let dayBlocks = [];
            if (isTeamView) {
              dayBlocks = allTasks.filter(t => t.due_date && toYMD(new Date(t.due_date)) === dayYMD);
            } else {
              dayBlocks = blocks.filter(b => b.date === dayYMD);
            }
            const plannedMins = dayBlocks.reduce((sum, b) => sum + (isTeamView ? getTotalLoggedMins(b) : b.durationMins || 0), 0);
            return (
              <div key={d.toISOString()} className="flex-1 border-r border-gray-200 dark:border-slate-700/20 p-2 space-y-1 bg-gray-50 dark:bg-slate-800/10" style={{minWidth: `${dayWidth}px`, maxWidth: `${dayWidth}px`}}>
                {dayBlocks.slice(0, 4).map(b => {
                  const bc = blockColor(isTeamView ? b.id : b.taskId);
                  return (
                    <div key={b.id} className={`text-[10px] font-semibold px-1.5 py-1 rounded border ${bc.bg} ${bc.border} ${bc.text} truncate cursor-pointer hover:opacity-80 transition-opacity`}
                      title={b.taskTitle || b.title}
                      onClick={() => { setPlannerDate(d); setPlannerMode('day'); }}>
                      {isTeamView ? taskNum(b.id) : b.taskNum}
                    </div>
                  );
                })}
                {dayBlocks.length > 4 && <p className="text-[10px] text-gray-600 dark:text-slate-500 font-medium text-center">+{dayBlocks.length-4}</p>}
                <div className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-600 dark:text-slate-500 font-medium text-center">{fmtMins(plannedMins)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // MonthView
  const MonthView = () => {
    const monthDays = getMonthMatrix(plannerDate);

    return (
      <div className="flex flex-col border-t border-gray-200 dark:border-slate-700/30">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700/20 bg-gray-100 dark:bg-slate-800/30">
          {WEEK_LABELS.map(l => (
            <div key={l} className="py-2 text-center text-xs font-semibold text-gray-700 dark:text-slate-400">{l}</div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1 p-3">
          {monthDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="bg-gray-200 dark:bg-slate-900/30 rounded-lg" />;
            const dayYMD = toYMD(day);
            let dayBlocks = [];
            let plannedMins = 0;

            if (isTeamView) {
              dayBlocks = allTasks.filter(b => b.due_date && toYMD(new Date(b.due_date)) === dayYMD);
              plannedMins = dayBlocks.reduce((sum, t) => sum + getTotalLoggedMins(t), 0);
            } else {
              dayBlocks = blocks.filter(b => b.date === dayYMD);
              plannedMins = dayBlocks.reduce((sum,b) => sum+b.durationMins, 0);
            }

            const isToday = sameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`p-2 rounded-lg border cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/20 transition-colors ${isToday?'border-teal-400 dark:border-teal-600/50 bg-teal-100 dark:bg-teal-950/30':'border-gray-300 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30'}`}
                onClick={() => { setPlannerDate(day); setPlannerMode('day'); }}>
                <p className={`text-sm font-bold ${isToday?'text-teal-700 dark:text-teal-400':'text-gray-900 dark:text-white'}`}>{day.getDate()}</p>
                <div className="space-y-0.5 mt-1">
                  {dayBlocks.slice(0, 2).map(b => {
                    const bc = blockColor(isTeamView ? b.id : b.taskId);
                    return (
                      <div key={b.id} className={`text-[8px] font-bold px-1 py-0.5 rounded border ${bc.bg} ${bc.border} ${bc.text} truncate`}
                        title={isTeamView ? taskNum(b.id) : b.taskNum}>
                        {isTeamView ? taskNum(b.id) : b.taskNum}
                      </div>
                    );
                  })}
                  {dayBlocks.length > 2 && <p className="text-[8px] text-gray-600 dark:text-slate-500 font-medium text-center">+{dayBlocks.length-2}</p>}
                </div>
                <p className="text-[10px] text-gray-600 dark:text-slate-500 font-medium text-center mt-1">{fmtMins(plannedMins)}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col" style={{height: 'calc(100vh - 240px)'}}>
      {/* Toolbar — Fixed */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700/50 bg-gray-100 dark:bg-slate-700/20 flex-wrap gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(plannerDate); d.setDate(d.getDate()-1); setPlannerDate(d); }}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-400 transition-colors" title="Previous day">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={() => setPlannerDate(new Date())}
            className="px-2.5 py-1 text-xs font-medium border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700/50 bg-gray-200 dark:bg-slate-700/20 text-gray-800 dark:text-slate-300">
            Today
          </button>
          <button onClick={() => { const d = new Date(plannerDate); d.setDate(d.getDate()+1); setPlannerDate(d); }}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-400 transition-colors" title="Next day">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-200 ml-1">
            {plannerMode==='day' ? new Date(plannerDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}) : plannerMode==='week' ? `Week of ${getWeekDays(plannerDate)[0].toLocaleDateString('en-IN',{day:'numeric',month:'long'})}` : `${MONTH_NAMES[plannerDate.getMonth()]} ${plannerDate.getFullYear()}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {plannerMode === 'day' && (
            <button onClick={() => setExpanded(e => !e)}
              className="px-2.5 py-1 text-xs font-medium border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700/50 bg-gray-200 dark:bg-slate-700/20 text-gray-800 dark:text-slate-300">
              {expanded ? `${pad(DEFAULT_START)}–${pad(DEFAULT_END)} ↑` : `${pad(FULL_START)}–${pad(FULL_END)} ↓`}
            </button>
          )}
          <div className="flex bg-gray-200 dark:bg-slate-700/30 rounded-lg p-0.5 border border-gray-300 dark:border-slate-700/50">
            {['day','week','month'].map(m => {
              const icons = { day: '📅', week: '📋', month: '🗓️' };
              return (
                <button key={m} onClick={() => setPlannerMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors flex items-center gap-1 ${plannerMode===m?'bg-gray-300 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm':'text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}>
                  <span>{icons[m]}</span>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content — Scrollable */}
      <div className="flex-1 overflow-auto bg-white dark:bg-transparent">
        {plannerMode === 'day'   && <DayView />}
        {plannerMode === 'week'  && <WeekView />}
        {plannerMode === 'month' && <MonthView />}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700/30 bg-gray-100 dark:bg-slate-700/10 flex-shrink-0">
        <p className="text-xs text-gray-700 dark:text-slate-400">
          {isTeamView
            ? 'View team members\' task progress · Click to see details'
            : 'Click the timeline to plan · Click a block to edit · Week/month: click a day header to drill in'}
        </p>
      </div>
    </div>
  );
}

// ── Sortable header ───────────────────────────────────────────────────────────
function SortTh({ label, col, sort, onSort, className='' }) {
  const active = sort.col === col;
  return (
    <th onClick={() => onSort(col)}
      className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-900 dark:hover:text-slate-200 transition-colors ${className}`}>
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${active?'text-teal-600 dark:text-teal-500':'text-gray-400 dark:text-slate-600'}`}>
          {active ? (sort.dir==='asc'?'↑':'↓') : '↕'}
        </span>
      </span>
    </th>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, serial, onAction, onNavigate, tab, currentUserId, timer, onStart }) {
  const isOverdue   = task.due_date && new Date(task.due_date) < new Date() && !['completed','cancelled'].includes(task.status);
  const isCreatedBy = task.created_by?.id === currentUserId || task.created_by_user_id === currentUserId;
  const isAssigned  = task.assigned_user?.id === currentUserId || task.assigned_user_id === currentUserId;
  const isObserver  = !isCreatedBy && !isAssigned;
  const isRunning   = timer?.taskId === task.id && !timer?.paused;
  const loggedMins  = getTotalLoggedMins(task);

  const leftBorder = isRunning ? 'border-l-4 border-l-teal-500'
    : isOverdue ? 'border-l-4 border-l-red-400'
    : task.status === 'in_progress' ? 'border-l-4 border-l-teal-300'
    : sameDay(task.due_date ? new Date(task.due_date) : null, new Date()) ? 'border-l-4 border-l-orange-400'
    : 'border-l-4 border-l-transparent';

  return (
    <tr className={`group hover:bg-gray-100 dark:hover:bg-slate-700/20 transition-colors ${isRunning?'bg-teal-100 dark:bg-teal-950/20':''} ${leftBorder}`}>
      <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-slate-500 text-right w-8 tabular-nums">{serial}</td>
      <td className="px-3 py-2.5 w-28">
        <span className="text-xs font-mono text-teal-600 dark:text-teal-400">{taskNum(task.id)}</span>
      </td>
      <td className="px-3 py-2.5">
        <button onClick={() => onNavigate(task.id)}
          className="text-sm font-medium text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 text-left line-clamp-1 block w-full">
          {task.title}
        </button>
        {(task.role?.name || task.area?.area_name) && (
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 truncate">
            {task.role?.name}{task.area?.area_name ? ` · ${task.area.area_name}` : ''}
          </p>
        )}
      </td>
      <td className="px-3 py-2.5 w-28">
        {isAssigned  && <span className="text-xs bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-900/50 rounded-full px-2 py-0.5">Assigned</span>}
        {isCreatedBy && <span className="text-xs bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-900/50 rounded-full px-2 py-0.5">Created</span>}
        {isObserver  && <span className="text-xs bg-gray-200 dark:bg-slate-900/40 text-gray-700 dark:text-slate-400 border border-gray-300 dark:border-slate-800/50 rounded-full px-2 py-0.5">Observer</span>}
      </td>
      <td className="px-3 py-2.5 w-24">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_CLS[task.priority]||''}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]||'bg-gray-500'}`} />
          {task.priority?.charAt(0).toUpperCase()+task.priority?.slice(1)}
        </span>
      </td>
      <td className="px-3 py-2.5 w-40">
        <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLS[task.status]||''}`}>
          {getStatusLabel(task)}
        </span>
      </td>
      <td className="px-3 py-2.5 w-28">
        <span className="text-base font-bold text-amber-600 dark:text-amber-300">{formatLoggedTime(loggedMins)}</span>
      </td>
      <td className="px-3 py-2.5 w-24">
        {task.due_date
          ? <span className={`text-xs font-medium ${isOverdue?'text-red-600 dark:text-red-400':'text-gray-600 dark:text-slate-400'}`}>{isOverdue&&'⚠ '}{fmtDate(task.due_date)}</span>
          : <span className="text-xs text-gray-500 dark:text-slate-500">—</span>}
      </td>
      <td className="px-3 py-2.5 w-40">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Timer / Start button — only for assigned active tasks */}
          {tab === 'active' && isAssigned && !['completed','cancelled'].includes(task.status) && (
            isRunning ? (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold animate-pulse">● Running</span>
            ) : (
              <button onClick={() => onStart(task)}
                className="text-xs px-2 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 whitespace-nowrap font-medium">
                ▶ Start
              </button>
            )
          )}
          {tab === 'active' && isAssigned && !['completed','cancelled'].includes(task.status) && (
            <button onClick={() => onAction(task, 'complete')}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">✓</button>
          )}
          {tab === 'needs_attention' && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Review</span>
          )}
          <button onClick={() => onNavigate(task.id)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-400 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700/50">View →</button>
        </div>
      </td>
    </tr>
  );
}

// ── Complete Modal ────────────────────────────────────────────────────────────
function CompleteModal({ open, task, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setNote(''); }, [open]);
  const handle = async () => {
    setSaving(true);
    try {
      await api.post(`/tenant/execution/tasks/${task.id}/complete`, { note });
      onDone(); onClose();
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
    finally { setSaving(false); }
  };
  if (!open || !task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Task</h2>
          <button onClick={onClose} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <p className="text-sm text-gray-900 dark:text-slate-300 font-medium mb-1">{task.title}</p>
            <p className="text-xs text-gray-600 dark:text-slate-400">{taskNum(task.id)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Completion Notes (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add any notes about completion…" rows="3"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 dark:border-slate-700/50">
          <button onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 font-medium">
            Cancel
          </button>
          <button onClick={handle} disabled={saving}
            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
            {saving ? 'Saving…' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Tab Constants ─────────────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'my-tasks', label: 'My Tasks', icon: '👤' },
  { key: 'team-tasks', label: 'My Team Tasks', icon: '👥' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const tabParam    = searchParams.get('tab');
  const statusParam = searchParams.get('status');
  const overdueParam= searchParams.get('overdue') === '1';

  // State for new 3-level navigation
  const [mainTab, setMainTab]       = useState('my-tasks');     // 'my-tasks' or 'team-tasks'
  const [viewMode, setViewMode]     = useState('list');         // 'list' or 'planner'
  const [filterTab, setFilterTab]   = useState(tabParam || 'active'); // 'active', 'needs_attention', 'completed'

  const [plannerMode, setPlannerMode] = useState('day');
  const [plannerDate, setPlannerDate] = useState(new Date());
  const [blocks, setBlocks]         = useState(loadBlocks);
  const [blockModal, setBlockModal] = useState({ open: false, initial: null });

  const [tasks, setTasks]       = useState([]);
  const [allActiveTasks, setAllActiveTasks] = useState([]);
  const [counts, setCounts]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState({ col: null, dir: 'asc' });
  const [completeModal, setCompleteModal] = useState({ open: false, task: null });
  const [showCreate, setShowCreate] = useState(false);
  const [roles, setRoles]       = useState([]);
  const [users, setUsers]       = useState([]);

  // Live timer
  const { timer, elapsed, startTask, pauseTask, resumeTask, stopTask } = useTimer();

  // Determine available filters based on mainTab
  const getAvailableFilters = () => {
    if (mainTab === 'team-tasks') {
      return ['active', 'completed']; // No 'needs_attention' for team
    }
    return ['active', 'needs_attention', 'completed']; // All for my tasks
  };

  const load = useCallback(async (activeTab) => {
    setLoading(true);
    try {
      const endpoint = mainTab === 'team-tasks' ? '/tenant/execution/tasks/team' : '/tenant/execution/tasks/staff';
      const res = await api.get(`${endpoint}?tab=${activeTab}`);
      setTasks(res.data || []);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [mainTab]);

  useEffect(() => {
    const endpoint = mainTab === 'team-tasks' ? '/tenant/execution/tasks/team' : '/tenant/execution/tasks/staff';
    const availableFilters = getAvailableFilters();
    Promise.all(availableFilters.map(f =>
      api.get(`${endpoint}?tab=${f}`)
        .then(r => ({ [f]: r.data.length }))
        .catch(() => ({ [f]: 0 }))
    )).then(results => {
      setCounts(Object.assign({}, ...results));
      api.get(`${endpoint}?tab=active`)
        .then(r => setAllActiveTasks(r.data || [])).catch(() => {});
    });
    api.get('/tenant/execution/roles').then(r => setRoles(r.data||[])).catch(() => {});
    api.get('/tenant/users?per_page=100').then(r => setUsers(r.data?.data||[])).catch(() => {});
  }, [mainTab]);

  useEffect(() => { load(filterTab); }, [filterTab, load]);
  useEffect(() => { persistBlocks(blocks); }, [blocks]);

  // When changing mainTab, reset filterTab to 'active'
  const handleMainTabChange = (newMainTab) => {
    setMainTab(newMainTab);
    setFilterTab('active');
  };

  const handleStartTask = async (task) => {
    try { await api.put(`/tenant/execution/tasks/${task.id}`, { status: 'in_progress' }); } catch { /* silent */ }
    startTask(task);
    load(filterTab);
  };

  const handleSortCol = (col) => {
    setSort(s => s.col === col ? { col, dir: s.dir==='asc'?'desc':'asc' } : { col, dir:'asc' });
  };

  const isOverdueFn = t => t.due_date && new Date(t.due_date) < new Date() && !['completed','cancelled'].includes(t.status);
  const isTodayFn   = t => t.due_date && sameDay(new Date(t.due_date), new Date()) && !isOverdueFn(t);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (statusParam)  list = list.filter(t => t.status === statusParam);
    else if (overdueParam) list = list.filter(t => isOverdueFn(t));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        taskNum(t.id).toLowerCase().includes(q) ||
        t.role?.name?.toLowerCase().includes(q) ||
        t.area?.area_name?.toLowerCase().includes(q)
      );
    }
    if (sort.col) {
      list.sort((a, b) => {
        if (sort.col==='title')    return sort.dir==='asc' ? (a.title||'').localeCompare(b.title||'') : (b.title||'').localeCompare(a.title||'');
        if (sort.col==='priority') { const d=(PRIORITY_ORD[a.priority]||0)-(PRIORITY_ORD[b.priority]||0); return sort.dir==='asc'?d:-d; }
        if (sort.col==='status')   { const d=(STATUS_ORD[a.status]||0)-(STATUS_ORD[b.status]||0); return sort.dir==='asc'?d:-d; }
        if (sort.col==='due_date') {
          const va = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const vb = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return sort.dir==='asc' ? va-vb : vb-va;
        }
        return 0;
      });
    } else if (filterTab==='active') {
      list.sort((a,b) => {
        const urg = t => isOverdueFn(t)?4 : isTodayFn(t)?3 : t.status==='in_progress'?2 : 1;
        return urg(b)-urg(a);
      });
    }
    return list;
  }, [tasks, statusParam, overdueParam, search, sort, filterTab]);

  const filterLabel = statusParam ? `Status: ${STATUS_LABEL[statusParam]||statusParam}`
    : overdueParam ? 'Filter: Overdue' : null;

  const isTeamView = mainTab === 'team-tasks';
  const availableFilters = getAvailableFilters();

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 min-h-screen flex flex-col">

      {/* FIXED HEADER & CONTROLS — at top, very compact */}
      <div className="p-4 border-b border-slate-700/30 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-sm space-y-3 flex-shrink-0">

        {/* Title + Date */}
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>

        {/* Top Right: Compact Navigation Controls */}
        <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
          {/* My Tasks / Team Tasks dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-slate-700/50 p-1">
            {MAIN_TABS.map(mt => (
              <button key={mt.key} onClick={() => handleMainTabChange(mt.key)}
                className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                  mainTab===mt.key
                    ? 'bg-teal-600/40 text-teal-700 dark:text-teal-300'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
                }`}
                title={mt.label}>
                {mt.icon} {mt.label}
              </button>
            ))}
          </div>

          {/* List / Planner toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-slate-700/50 p-1">
            <button onClick={() => setViewMode('list')}
              className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                viewMode==='list'
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
              }`}>
              List
            </button>
            <button onClick={() => setViewMode('planner')}
              className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                viewMode==='planner'
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
              }`}>
              Planner
            </button>
          </div>
        </div>

        {/* Filter Bar — compact, only in list view */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-full pl-8 pr-8 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">&times;</button>
              )}
            </div>

            {/* Filter chips — very small */}
            <div className="flex items-center gap-1">
              {availableFilters.map(f => {
                const count = counts[f] ?? 0;
                return (
                  <button key={f} onClick={() => { setFilterTab(f); navigate('/app/execution/tasks/my',{replace:true}); }}
                    className={`text-xs font-medium px-2 py-1 rounded transition-colors whitespace-nowrap ${
                      filterTab===f
                        ? 'bg-teal-100 dark:bg-teal-600/30 text-teal-700 dark:text-teal-300'
                        : 'bg-gray-200 dark:bg-slate-800/50 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
                    }`}>
                    {f === 'active' ? `Active (${count})` : f === 'needs_attention' ? `Attention (${count})` : `Done (${count})`}
                  </button>
                );
              })}
            </div>

            {/* New Task button */}
            {mainTab === 'my-tasks' && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 font-medium flex-shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
                New
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timer bar — only show for My Tasks in List view */}
      {mainTab === 'my-tasks' && viewMode === 'list' && (
        <TimerBar timer={timer} elapsed={elapsed}
          onPause={pauseTask} onResume={resumeTask} onStop={stopTask}
          onNavigate={id => navigate(`/app/execution/tasks/${id}`)}
          isVisible={true} />
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ──────────────────── MAIN CONTENT AREA (90% VIEWPORT) ─────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════════ */}

      {/* ── PLANNER VIEW ──────────────────────────────────────────────────────── */}
      {viewMode === 'planner' && (
        <div className="flex-1 overflow-hidden p-4">
          <PlannerView
            blocks={blocks}
            onAddBlock={pf => setBlockModal({ open:true, initial: { taskId:'', date: pf.date||toYMD(plannerDate), startHour: pf.startHour??9, startMinute: pf.startMinute??0, durationMins:15, note:'' } })}
            onEditBlock={b => setBlockModal({ open:true, initial: {...b} })}
            allTasks={allActiveTasks}
            plannerMode={plannerMode} setPlannerMode={setPlannerMode}
            plannerDate={plannerDate} setPlannerDate={setPlannerDate}
            isTeamView={isTeamView}
          />
        </div>
      )}

      {/* ── LIST VIEW (DATA GRID) ─────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-auto p-4">
          {filterLabel && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-lg text-sm text-teal-700 dark:text-teal-400 mb-3">
              <span className="font-medium">{filterLabel}</span>
              <span className="text-teal-600 dark:text-teal-500">— {filtered.length} task{filtered.length!==1?'s':''}</span>
              <button onClick={() => navigate('/app/execution/tasks/my',{replace:true})} className="ml-auto text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline">Clear</button>
            </div>
          )}

          {filterTab === 'needs_attention' && !filterLabel && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-700 dark:text-amber-400 mb-3">
              Tasks <strong>you created</strong> that are completed and need your review or approval.
            </div>
          )}

          {mainTab === 'team-tasks' && !filterLabel && (
            <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-lg text-xs text-purple-700 dark:text-purple-400 mb-3">
              Tasks assigned to <strong>your team members</strong> (users who report to you). Monitor their progress, comments, and time tracking.
            </div>
          )}

          {/* Data grid container */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col h-full">

            {/* Stat summary */}
            {filterTab === 'active' && !filterLabel && (
              <div className="grid grid-cols-5 border-b border-gray-200 dark:border-slate-700/50 divide-x divide-gray-200 dark:divide-slate-700/50 flex-shrink-0 bg-gray-50 dark:bg-transparent">
                {[
                  { label:'Total',       val: tasks.length,                                         color:'text-gray-900 dark:text-white' },
                  { label:'Overdue',     val: tasks.filter(t=>isOverdueFn(t)).length,               color:'text-red-500 dark:text-red-400' },
                  { label:'Due Today',   val: tasks.filter(t=>isTodayFn(t)).length,                 color:'text-orange-500 dark:text-orange-400' },
                  { label:'In Progress', val: tasks.filter(t=>t.status==='in_progress').length,     color:'text-teal-500 dark:text-teal-400' },
                  { label:'Not Started', val: tasks.filter(t=>t.status==='pending').length,         color:'text-gray-600 dark:text-slate-400' },
                ].map(s => (
                  <div key={s.label} className="px-5 py-3 text-center">
                    <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.val}</p>
                    <p className="text-[11px] text-gray-600 dark:text-slate-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Table container — scrollable */}
            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="animate-spin w-7 h-7 border-4 border-teal-600 border-t-transparent rounded-full"/>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <p className="text-3xl mb-3">{search ? '🔍' : filterTab==='active' ? '🎉' : mainTab==='team-tasks' ? '👥' : '📋'}</p>
                  <p className="font-semibold text-gray-600 dark:text-slate-300">
                    {search ? 'No tasks match your search' : filterTab==='active' ? 'All clear!' : filterTab==='needs_attention' ? 'Nothing needs attention' : mainTab==='team-tasks' ? 'No team tasks yet' : 'No completed tasks yet'}
                  </p>
                  {search && <button onClick={() => setSearch('')} className="mt-2 text-sm text-teal-600 dark:text-teal-400 hover:underline">Clear search</button>}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-slate-700/30 sticky top-0 z-10">
                    <tr className="border-b border-gray-200 dark:border-slate-700/50">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-400 w-8">#</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-400 uppercase tracking-wide w-28">Task ID</th>
                      <SortTh label="Title"    col="title"    sort={sort} onSort={handleSortCol} />
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-400 uppercase tracking-wide w-28">Role</th>
                      <SortTh label="Priority" col="priority" sort={sort} onSort={handleSortCol} className="w-24" />
                      <SortTh label="Status"   col="status"   sort={sort} onSort={handleSortCol} className="w-40" />
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-slate-400 uppercase tracking-wide w-28">Logged Time</th>
                      <SortTh label="Due"      col="due_date" sort={sort} onSort={handleSortCol} className="w-24" />
                      <th className="px-3 py-3 w-40" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700/30">
                    {filtered.map((task, idx) => (
                      <TaskRow key={task.id} task={task} serial={idx+1} tab={filterTab}
                        currentUserId={user?.id} timer={timer}
                        onStart={handleStartTask}
                        onAction={(t,a) => setCompleteModal({ open:true, task:t })}
                        onNavigate={id => navigate(`/app/execution/tasks/${id}`)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <BlockModal
        open={blockModal.open}
        initial={blockModal.initial}
        allTasks={allActiveTasks}
        onSave={(block) => {
          setBlocks(bs => {
            const existing = bs.findIndex(b => b.id === block.id);
            if (existing >= 0) {
              const updated = [...bs];
              updated[existing] = block;
              return updated;
            }
            return [...bs, block];
          });
          setBlockModal({ open:false, initial: null });
        }}
        onDelete={(id) => setBlocks(bs => bs.filter(b => b.id !== id))}
        onClose={() => setBlockModal({ open:false, initial: null })}
      />

      <CompleteModal
        open={completeModal.open}
        task={completeModal.task}
        onClose={() => setCompleteModal({ open:false, task: null })}
        onDone={() => load(filterTab)}
      />

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { load(filterTab); setShowCreate(false); }}
        roles={roles}
        users={users}
      />
    </div>
  );
}
