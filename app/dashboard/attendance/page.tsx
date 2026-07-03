"use client";
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { AttendanceRecord, Meeting } from "@/lib/types";

type DateFilter = "all" | "today" | "yesterday" | "7d" | "30d" | "custom";

function dstr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [meetingFilter, setMeetingFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sortKey, setSortKey] = useState<"time" | "name" | "dept">("time");

  const load = () => {
    fetch("/api/attendance").then((r) => r.json()).then((d) => Array.isArray(d) && setRecords(d));
    fetch("/api/meetings").then((r) => r.json()).then((d) => Array.isArray(d) && setMeetings(d));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const today = dstr(new Date());
    const yesterday = dstr(new Date(Date.now() - 86400000));
    const d7 = dstr(new Date(Date.now() - 7 * 86400000));
    const d30 = dstr(new Date(Date.now() - 30 * 86400000));

    let out = records.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.meetingName.toLowerCase().includes(q);
      const matchMeeting = !meetingFilter || r.meetingId === meetingFilter;

      let matchDate = true;
      if (dateFilter === "today") matchDate = r.attDate === today;
      else if (dateFilter === "yesterday") matchDate = r.attDate === yesterday;
      else if (dateFilter === "7d") matchDate = r.attDate >= d7;
      else if (dateFilter === "30d") matchDate = r.attDate >= d30;
      else if (dateFilter === "custom")
        matchDate =
          (!customFrom || r.attDate >= customFrom) && (!customTo || r.attDate <= customTo);

      return matchSearch && matchMeeting && matchDate;
    });

    if (sortKey === "name") out = out.slice().sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "dept") out = out.slice().sort((a, b) => a.department.localeCompare(b.department));
    return out;
  }, [records, search, meetingFilter, dateFilter, customFrom, customTo, sortKey]);

  async function remove(id: string) {
    if (!confirm("Delete this attendance record?")) return;
    await fetch("/api/attendance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = filtered.map((r, i) => ({
      "Sl No": i + 1,
      "Meeting ID": r.meetingId,
      "Meeting Name": r.meetingName,
      "Meeting Date": r.meetingDate,
      "Meeting Time": r.meetingTime,
      "Attendance Date": r.attDate,
      "Attendance Time": r.attTime,
      Name: r.name,
      "Mobile Number": r.mobile,
      Designation: r.designation,
      Department: r.department,
      Remarks: r.remarks,
      Latitude: r.latitude ?? "",
      Longitude: r.longitude ?? "",
      "Location Link": r.latitude ? `https://maps.google.com/?q=${r.latitude},${r.longitude}` : "",
      Browser: r.browser,
      Device: r.device,
      "IP Address": r.ip,
      "Created Timestamp": r.createdAt,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] || { a: 1 }).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${dstr(new Date())}.xlsx`);
  }

  async function exportPDF() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const meeting = meetings.find((m) => m.id === meetingFilter);
    const doc = new jsPDF({ orientation: "landscape" });

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 297, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(meeting ? meeting.name : "Attendance Report — All Meetings", 14, 10);
    doc.setFontSize(9);
    const sub = meeting
      ? `${meeting.date} ${meeting.time}  |  ${meeting.venue || ""}  |  ${meeting.department || ""}`
      : `Generated report of ${filtered.length} attendance records`;
    doc.text(sub, 14, 17);

    // Summary
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text(`Total Present: ${filtered.length}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [["S.No", "Name", "Mobile", "Designation", "Department", "Attendance Time", "Remarks"]],
      body: filtered.map((r, i) => [
        i + 1, r.name, r.mobile, r.designation, r.department, `${r.attDate} ${r.attTime}`, r.remarks,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      didDrawPage: () => {
        const page = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Generated: ${new Date().toLocaleString("en-IN")}   |   Page ${page}`,
          14,
          doc.internal.pageSize.height - 6
        );
      },
    });

    doc.save(`Attendance_Report_${dstr(new Date())}.pdf`);
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold">
          Attendance{" "}
          <span className="badge bg-gov-100 text-gov-800 dark:bg-gov-900 dark:text-gov-100 align-middle">
            {filtered.length}
          </span>
        </h1>
        <div className="flex gap-2">
          <button className="btn btn-success" onClick={exportExcel} disabled={!filtered.length}>
            Export Excel
          </button>
          <button className="btn btn-primary" onClick={exportPDF} disabled={!filtered.length}>
            Export PDF
          </button>
        </div>
      </div>

      <div className="card p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Search name / mobile / dept / designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={meetingFilter} onChange={(e) => setMeetingFilter(e.target.value)}>
          <option value="">All Meetings</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.date})
            </option>
          ))}
        </select>
        <select className="input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom Date</option>
        </select>
        <select className="input" value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}>
          <option value="time">Sort: Latest First</option>
          <option value="name">Sort: Name (A-Z)</option>
          <option value="dept">Sort: Department</option>
        </select>
        {dateFilter === "custom" && (
          <>
            <input className="input" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <input className="input" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gov-800 text-white text-left">
                {["#", "Name", "Mobile", "Designation", "Department", "Meeting", "Date", "Time", "Location", ""].map(
                  (h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold whitespace-nowrap text-xs">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No attendance records found
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 dark:border-slate-800 odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/40"
                >
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.name}</td>
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.mobile}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.designation}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.department}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 max-w-[180px] truncate" title={r.meetingName}>
                    {r.meetingName}
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{r.attDate}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{r.attTime}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.latitude ? (
                      <a
                        className="text-gov-500 hover:underline text-xs"
                        href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Map
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button className="btn btn-danger !px-2.5 !py-1 text-xs" onClick={() => remove(r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
