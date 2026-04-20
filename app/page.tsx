'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const weekTasks = [
  ['Read PG essay: Do Things That Don\'t Scale', 'Define PMF in your own words', 'Find 1 example of PMF in a brand you use'],
  ['Read PG essay: Startup = Growth', 'Define MVP in your own words', 'Think of 1 MVP you could build for any idea'],
  ['Watch YC: Michael Seibel on Traction', 'Define Traction in your own words', 'What is one traction signal you have noticed?'],
  ['Read about Churn and retention basics', 'Define Churn in your own words', 'Name 1 app you have churned from and why'],
  ['Read Venture Deals ch.1', 'Understand MRR vs ARR', 'Calculate ARR for a made-up subscription company'],
  ['Read Venture Deals ch.2', 'Learn what a cap table is', 'Sketch a simple cap table on paper'],
  ['Read about SAFEs via YC SAFE primer', 'Explain SAFE to a friend in 2 sentences', 'Find 1 startup that raised on SAFEs'],
  ['Read Venture Deals ch.3', 'Understand pre-money vs post-money', 'Work through a simple dilution example'],
  ['Read about unit economics', 'Define LTV and CAC in your own words', 'Estimate LTV and CAC for any real business'],
  ['Read Venture Deals ch.4 and 5', 'Understand what a term sheet covers', 'List 3 things you would negotiate as a founder'],
  ['Listen to How I Built This, any episode', 'Write a 5-sentence teardown of that company', 'Identify the PMF moment in their story'],
]

const phaseOf = (w: number) => w < 4 ? 1 : w < 10 ? 2 : 3

const phaseColors = {
  1: { accent: '#F4907A', light: '#FFF0EB', border: '#F9C4A0', text: '#7A2E1A', label: 'Foundation' },
  2: { accent: '#6DB87A', light: '#EDF7EE', border: '#A8D8AA', text: '#1A5C28', label: 'Money and metrics' },
  3: { accent: '#C084C8', light: '#F7EEFA', border: '#DDB8E0', text: '#5C1A6A', label: 'Apply and observe' },
}

const statCards = [
  { label: 'streak', bg: '#FFF3E0', border: '#F9C4A0', text: '#C25E10', key: 'streak' },
  { label: 'days done', bg: '#FFF0EB', border: '#F4907A', text: '#7A2E1A', key: 'done' },
  { label: 'xp', bg: '#EDF7EE', border: '#A8D8AA', text: '#1A5C28', key: 'xp' },
  { label: 'level', bg: '#F7EEFA', border: '#DDB8E0', text: '#5C1A6A', key: 'level' },
]

export default function Home() {
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [tasks, setTasks] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: days } = await supabase.from('streak_days').select('*').eq('user_id', 'geeta')
    const { data: taskData } = await supabase.from('tasks').select('*').eq('user_id', 'geeta')
    const c: Record<string, boolean> = {}
    const t: Record<string, boolean> = {}
    days?.forEach((d: any) => { if (d.checked) c[`w${d.week_num}d${d.day_num}`] = true })
    taskData?.forEach((t2: any) => { if (t2.completed) t[`t${t2.week_num}_${t2.task_index}`] = true })
    setChecks(c)
    setTasks(t)
    setLoading(false)
  }

  async function toggleDay(week: number, day: number) {
    const key = `w${week}d${day}`
    const newVal = !checks[key]
    setChecks(prev => ({ ...prev, [key]: newVal }))
    if (newVal) showToast('+10 xp')
    await supabase.from('streak_days').upsert(
      { user_id: 'geeta', week_num: week, day_num: day, checked: newVal, checked_at: newVal ? new Date().toISOString() : null },
      { onConflict: 'user_id,week_num,day_num' }
    )
  }

  async function toggleTask(week: number, idx: number) {
    const key = `t${week}_${idx}`
    const newVal = !tasks[key]
    setTasks(prev => ({ ...prev, [key]: newVal }))
    if (newVal) showToast('+25 xp')
    await supabase.from('tasks').upsert(
      { user_id: 'geeta', week_num: week, task_index: idx, completed: newVal, completed_at: newVal ? new Date().toISOString() : null },
      { onConflict: 'user_id,week_num,task_index' }
    )
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  const totalDays = 77
  const doneDays = Object.values(checks).filter(Boolean).length
  const pct = Math.round((doneDays / totalDays) * 100)

  const streak = (() => {
    let s = 0
    for (let w = 10; w >= 0; w--) {
      for (let d = 6; d >= 0; d--) {
        if (checks[`w${w}d${d}`]) s++
        else return s
      }
    }
    return s
  })()

  const xp = doneDays * 10 + Object.values(tasks).filter(Boolean).length * 25
  const level = Math.floor(xp / 100) + 1
  const xpInLevel = xp % 100

  const statValues: Record<string, string> = {
    streak: streak === 0 ? '0' : `${streak}`,
    done: `${doneDays}`,
    xp: `${xp}`,
    level: `${level}`,
  }

  function isUnlocked(w: number) {
    if (w === 0) return true
    const prev = Array.from({ length: 7 }, (_, d) => checks[`w${w - 1}d${d}`]).filter(Boolean).length
    return prev >= 4
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFAF5', color: '#7A4F2E', fontFamily: 'system-ui', fontSize: '15px' }}>
      loading your tracker...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FFFAF5', fontFamily: 'system-ui, sans-serif', padding: '32px 16px 64px', maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>

      {toast && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#6DB87A', color: '#fff', padding: '8px 20px', borderRadius: '99px', fontSize: '13px', fontWeight: 600, zIndex: 100 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 4px', color: '#3D1F0A' }}>
          Geeta's Learning OS
        </h1>
        <p style={{ fontSize: '13px', color: '#B07A5A', margin: 0 }}>startup and VC literacy, 11 week plan</p>
      </div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(80px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {statCards.map(s => (
          <div key={s.key} style={{ background: s.bg, borderRadius: '14px', padding: '14px 10px', textAlign: 'center', border: `1.5px solid ${s.border}` }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.text }}>{statValues[s.key]}</div>
            <div style={{ fontSize: '11px', color: s.text, marginTop: '3px', opacity: 0.7 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* xp bar */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', border: '1.5px solid #F4DDD0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#B07A5A', marginBottom: '8px' }}>
          <span>Level {level}</span>
          <span>{xpInLevel}/100 xp to next level</span>
        </div>
        <div style={{ background: '#F4DDD0', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpInLevel}%`, background: 'linear-gradient(90deg, #F4907A, #6DB87A)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#C8A090', textAlign: 'right' }}>{pct}% of plan complete</div>
      </div>

      {streak >= 3 && (
        <div style={{ background: '#FFF3E0', border: '1.5px solid #F9C4A0', borderRadius: '12px', padding: '10px 16px', marginBottom: '20px', fontSize: '13px', color: '#C25E10', fontWeight: 500 }}>
          {streak} day streak. keep going.
        </div>
      )}

      {/* phase legend */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[1, 2, 3].map(p => {
          const c = phaseColors[p as 1 | 2 | 3]
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.text }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: c.accent }} />
              {c.label}
            </div>
          )
        })}
      </div>

      {/* week cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '12px' }}>
      {Array.from({ length: 11 }, (_, w) => {
        const unlocked = isUnlocked(w)
        const phase = phaseOf(w)
        const colors = phaseColors[phase as 1 | 2 | 3]
        const daysDone = Array.from({ length: 7 }, (_, d) => checks[`w${w}d${d}`]).filter(Boolean).length
        const allDone = daysDone === 7

        return (
          <div key={w} style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px',
            border: `1.5px solid ${allDone ? colors.accent : colors.border}`,
            opacity: unlocked ? 1 : 0.45,
            borderLeft: `4px solid ${colors.accent}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#3D1F0A' }}>Week {w + 1}</span>
                <span style={{ fontSize: '11px', color: colors.text, marginLeft: '8px', background: colors.light, padding: '2px 8px', borderRadius: '20px' }}>{colors.label}</span>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: colors.light, color: colors.text, fontWeight: 600 }}>
                {!unlocked ? 'locked' : allDone ? 'complete' : `${daysDone}/7`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(36px, 1fr))', gap: '6px', marginBottom: unlocked ? '12px' : '0' }}>
              {DAYS.map((day, d) => {
                const checked = !!checks[`w${w}d${d}`]
                return (
                  <button key={d} onClick={() => unlocked && toggleDay(w, d)} style={{
                    aspectRatio: '1',
                    borderRadius: '10px',
                    border: `1.5px solid ${checked ? colors.accent : colors.border}`,
                    background: checked ? colors.accent : colors.light,
                    color: checked ? '#fff' : colors.text,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: unlocked ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                    transition: 'all 0.15s',
                  }}>
                    <span>{day}</span>
                    {checked && <span style={{ fontSize: '9px' }}>✓</span>}
                  </button>
                )
              })}
            </div>

            {unlocked && weekTasks[w].map((task, i) => {
              const done = !!tasks[`t${w}_${i}`]
              return (
                <div key={i} onClick={() => toggleTask(w, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderTop: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    border: `1.5px solid ${done ? colors.accent : colors.border}`,
                    background: done ? colors.accent : 'transparent',
                    flexShrink: 0, marginTop: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {done && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '13px', color: done ? '#C8A090' : '#3D1F0A', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.5 }}>
                    {task}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}