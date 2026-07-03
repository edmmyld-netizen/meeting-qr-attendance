"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Link from "next/link";

interface Stats {
  totalMeetings: number;
  todaysMeetings: number;
  totalAttendance: number;
  presentToday: number;
  byDept: Record<string, number>;
  byMeeting: Record<string, number>;
  trend: [string, number][];
  recent: {
    id: string;
    name: string;
    meetingName: string;
    department: string;
    attTime: string;
    attDate: string;
  }[];
}

function BarChart({
  data,
  color,
}: {
  data: [string, number][];
  color: string;
}) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  if (!data.length)
    return <p className="text-sm text-slate-400 py-6 text-center">No data yet</p>;
  return (
    <div className="space-y-2">
      {data.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-32 truncate text-xs text-slate-500 dark:text-slate-400" title={label}>
            {label}
          </span>
          <div className="flex-1 h-5 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const cards = [
    { label: "Total Meetings", value: stats?.totalMeetings ?? "—", color: "bg-gov-800" },
    { label: "Today's Meetings", value: stats?.todaysMeetings ?? "—", color: "bg-indigo-600" },
    { label: "Total Attendance", value: stats?.totalAttendance ?? "—", color: "bg-emerald-600" },
    { label: "Present Today", value: stats?.presentToday ?? "—", color: "bg-amber-600" },
  ];

  return (
    <Shell>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Link href="/dashboard/meetings/new" className="btn btn-primary">
          + Create New Meeting
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className={`h-2 w-10 rounded-full ${c.color} mb-3`} />
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Attendance by Department</h2>
          <BarChart
            data={Object.entries(stats?.byDept || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)}
            color="#1e40af"
          />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Meeting-wise Attendance</h2>
          <BarChart
            data={Object.entries(stats?.byMeeting || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)}
            color="#059669"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Attendance Trend (Last 14 days)</h2>
          <BarChart data={stats?.trend || []} color="#d97706" />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Recent Attendance</h2>
          {!stats?.recent?.length && (
            <p className="text-sm text-slate-400 py-6 text-center">No attendance yet</p>
          )}
          <div className="space-y-2">
            {stats?.recent?.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
              >
                <div className="h-9 w-9 rounded-full bg-gov-100 dark:bg-gov-900 text-gov-800 dark:text-gov-100 flex items-center justify-center font-bold text-sm shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{r.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {r.meetingName} • {r.department}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {r.attTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
