"use client";

import { useState, useEffect, useCallback } from "react";

const TASKS = [
  { key: "macWork1h", label: "Mac Work 1h" },
  { key: "gameWork2h", label: "Game Work 2h" },
  { key: "gym", label: "Gym" },
  { key: "boxing", label: "Boxing" },
  { key: "meditate", label: "Meditate" },
  { key: "cleanFoods", label: "Clean Foods" },
  { key: "proteinGoal", label: "Protein Goal" },
  { key: "noSugar", label: "No Sugar" },
  { key: "potassium", label: "Potassium" },
  { key: "wakeUpOnTime", label: "Wake Up 8-9am" },
  { key: "sleepOnTime", label: "Sleep 12-1am" },
  { key: "shower", label: "Shower" },
  { key: "skincare", label: "Skincare" },
  { key: "takeTrashOut", label: "Take Trash Out" },
] as const;

type TaskKey = (typeof TASKS)[number]["key"];

type DailyEntry = {
  id: string;
  date: string;
  score: number;
} & Record<TaskKey, boolean>;

const SESSION_KEY = "daily_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function getSession(): { expires: number } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    if (session.expires > Date.now()) return session;
    localStorage.removeItem(SESSION_KEY);
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
  return null;
}

function setSession() {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ expires: Date.now() + SESSION_DURATION })
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getScoreColor(score: number): string {
  if (score === 0) return "#ebedf0";
  if (score <= 7) return "rgba(106, 168, 79, 0.4)";
  if (score <= 12) return "#6aa84f";
  return "#8b5cf6";
}

function getContributionLevel(score: number): string {
  if (score === 0) return "No activity";
  if (score <= 7) return "Mediocre day";
  if (score <= 12) return "Good day";
  return "Perfect day";
}

function getLast365Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split("T")[0]);
  }
  return days;
}

function groupByWeeks(days: string[]): string[][] {
  const weeks: string[][] = [];
  let currentWeek: string[] = [];
  const firstDate = new Date(days[0]);
  const dayOfWeek = firstDate.getDay();
  for (let i = 0; i < dayOfWeek; i++) {
    currentWeek.push("");
  }
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  return weeks;
}

function getMonthDays(year: number, month: number): { day: number; date: string; weekNum: number }[] {
  const days: { day: number; date: string; weekNum: number }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const weekNum = Math.ceil((d + firstDay.getDay()) / 7);
    days.push({
      day: d,
      date: date.toISOString().split("T")[0],
      weekNum,
    });
  }
  return days;
}

function getWeeksInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);
}

function getDaysInWeek(days: { day: number; date: string; weekNum: number }[], weekNum: number) {
  return days.filter((d) => d.weekNum === weekNum);
}

export default function DailyPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = getTodayDate();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthDays = getMonthDays(currentYear, currentMonth);
  const weeksCount = getWeeksInMonth(currentYear, currentMonth);
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    const session = getSession();
    setIsAuthenticated(!!session);
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/daily");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEntries();
    }
  }, [isAuthenticated, fetchEntries]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/daily/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setSession();
        setIsAuthenticated(true);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(date: string, taskKey: TaskKey) {
    const entryMap = new Map(entries.map((e) => [e.date, e]));
    const existing = entryMap.get(date);
    const newValue = !existing?.[taskKey];

    // Optimistic update
    const updatedEntries = [...entries];
    const idx = updatedEntries.findIndex((e) => e.date === date);
    if (idx >= 0) {
      updatedEntries[idx] = { ...updatedEntries[idx], [taskKey]: newValue };
    } else {
      updatedEntries.push({
        id: "",
        date,
        score: 0,
        ...TASKS.reduce((acc, t) => ({ ...acc, [t.key]: t.key === taskKey ? newValue : false }), {}),
      } as DailyEntry);
    }
    setEntries(updatedEntries);

    try {
      await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          ...TASKS.reduce(
            (acc, t) => ({
              ...acc,
              [t.key]: t.key === taskKey ? newValue : !!(existing?.[t.key]),
            }),
            {}
          ),
        }),
      });
      fetchEntries();
    } catch (err) {
      console.error("Failed to save:", err);
      fetchEntries();
    }
  }

  const entryMap = new Map(entries.map((e) => [e.date, e]));
  const last365Days = getLast365Days();
  const weeks = groupByWeeks(last365Days);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ color: "#6aa84f", fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16, padding: 32, borderRadius: 12, border: "1px solid #e5e7eb", minWidth: 300 }}>
          <h1 style={{ margin: 0, fontSize: 24, color: "#6aa84f", textAlign: "center" }}>Daily Tracker</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 16, outline: "none" }}
            autoFocus
          />
          {error && <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: "12px 16px", borderRadius: 8, border: "none", background: "#6aa84f", color: "#fff", fontSize: 16, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", padding: "24px", overflow: "auto" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, color: "#1f2937", fontSize: 28 }}>Daily Tracker</h1>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* GitHub-style contribution graph */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 32, overflowX: "auto" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#1f2937", fontWeight: 500 }}>
            {entries.length} contributions in the last year
          </h2>
          <div style={{ display: "flex", marginLeft: 30, marginBottom: 4, gap: 3 }}>
            {weeks.map((week, weekIndex) => {
              if (!week[0]) return <div key={weekIndex} style={{ width: 11 }} />;
              const date = new Date(week[0]);
              const prevWeek = weeks[weekIndex - 1];
              const prevDate = prevWeek?.[0] ? new Date(prevWeek[0]) : null;
              const showMonth = !prevDate || date.getMonth() !== prevDate.getMonth();
              return (
                <div key={weekIndex} style={{ width: 11, fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {showMonth ? months[date.getMonth()] : ""}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 20, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 4, fontSize: 10, color: "#6b7280" }}>
              <div style={{ height: 11 }}></div>
              <div style={{ height: 11, lineHeight: "11px" }}>Mon</div>
              <div style={{ height: 11 }}></div>
              <div style={{ height: 11, lineHeight: "11px" }}>Wed</div>
              <div style={{ height: 11 }}></div>
              <div style={{ height: 11, lineHeight: "11px" }}>Fri</div>
              <div style={{ height: 11 }}></div>
            </div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {week.map((day, dayIndex) => {
                  if (!day) return <div key={dayIndex} style={{ width: 11, height: 11 }} />;
                  const entry = entryMap.get(day);
                  const score = entry?.score || 0;
                  const isFuture = day > today;
                  return (
                    <div
                      key={dayIndex}
                      onClick={() => !isFuture && setSelectedDate(day === selectedDate ? null : day)}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 2,
                        background: isFuture ? "#f3f4f6" : getScoreColor(score),
                        cursor: isFuture ? "default" : "pointer",
                        outline: day === selectedDate ? "2px solid #6aa84f" : "none",
                        outlineOffset: 1,
                      }}
                      title={`${day}: ${getContributionLevel(score)} (${score}/14)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, justifyContent: "flex-end", fontSize: 11, color: "#6b7280" }}>
            <span>Less</span>
            <div style={{ width: 11, height: 11, borderRadius: 2, background: "#ebedf0" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2, background: "rgba(106, 168, 79, 0.4)" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2, background: "#6aa84f" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2, background: "#8b5cf6" }} />
            <span>More</span>
          </div>
        </div>

        {/* Monthly habit table */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              {/* Month row */}
              <tr>
                <th style={{ padding: "8px 12px", background: "#6aa84f", color: "#fff", fontWeight: 600, fontSize: 16, textAlign: "center", borderRadius: "8px 0 0 0" }} colSpan={1}></th>
                <th style={{ padding: "8px 12px", background: "#6aa84f", color: "#fff", fontWeight: 600, fontSize: 16, textAlign: "center", borderRadius: "0 8px 0 0" }} colSpan={monthDays.length}>
                  {monthName}
                </th>
              </tr>
              {/* Week row */}
              <tr>
                <th style={{ padding: "6px 12px", background: "#f0fdf4", color: "#166534", fontWeight: 500, textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Habit</th>
                {Array.from({ length: weeksCount }, (_, i) => {
                  const daysInWeek = getDaysInWeek(monthDays, i + 1);
                  return (
                    <th
                      key={i}
                      colSpan={daysInWeek.length}
                      style={{ padding: "6px 4px", background: "#f0fdf4", color: "#166534", fontWeight: 500, textAlign: "center", borderBottom: "1px solid #e5e7eb", fontSize: 11 }}
                    >
                      Week {i + 1}
                    </th>
                  );
                })}
              </tr>
              {/* Day row */}
              <tr>
                <th style={{ padding: "6px 12px", background: "#fafafa", color: "#6b7280", fontWeight: 400, textAlign: "left", borderBottom: "1px solid #e5e7eb" }}></th>
                {monthDays.map((d) => {
                  const isToday = d.date === today;
                  return (
                    <th
                      key={d.day}
                      style={{
                        padding: "4px 2px",
                        background: isToday ? "#6aa84f" : "#fafafa",
                        color: isToday ? "#fff" : "#6b7280",
                        fontWeight: isToday ? 600 : 400,
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                        minWidth: 28,
                        fontSize: 11,
                      }}
                    >
                      {d.day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {TASKS.map((task, taskIdx) => (
                <tr key={task.key} style={{ background: taskIdx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500, color: "#374151", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                    {task.label}
                  </td>
                  {monthDays.map((d) => {
                    const entry = entryMap.get(d.date);
                    const isChecked = !!entry?.[task.key];
                    const isFuture = d.date > today;
                    const isToday = d.date === today;
                    return (
                      <td
                        key={d.day}
                        style={{
                          padding: "4px 2px",
                          textAlign: "center",
                          borderBottom: "1px solid #f3f4f6",
                          background: isToday ? "rgba(106, 168, 79, 0.1)" : undefined,
                        }}
                      >
                        <button
                          onClick={() => !isFuture && toggleTask(d.date, task.key)}
                          disabled={isFuture}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            border: isChecked ? "none" : "2px solid #d1d5db",
                            background: isFuture ? "#f3f4f6" : isChecked ? "#6aa84f" : "#fff",
                            cursor: isFuture ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 10,
                            margin: "0 auto",
                            opacity: isFuture ? 0.4 : 1,
                          }}
                        >
                          {isChecked && "✓"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
