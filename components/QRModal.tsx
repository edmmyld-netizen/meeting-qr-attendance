"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Meeting } from "@/lib/types";

export default function QRModal({
  meeting,
  onClose,
}: {
  meeting: Meeting;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const u = `${window.location.origin}/attendance/${meeting.id}`;
    setUrl(u);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, u, {
        width: 260,
        margin: 2,
        color: { dark: "#1e3a8a", light: "#ffffff" },
      });
    }
  }, [meeting.id]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `QR_${meeting.id}.png`;
    a.click();
  }

  function print() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR — ${meeting.name}</title>
<style>body{font-family:Arial,sans-serif;text-align:center;padding:40px}
h2{color:#1e3a8a;margin-bottom:4px}.sub{color:#555;font-size:14px;margin-bottom:16px}
img{width:280px;height:280px;border:3px solid #1e3a8a;border-radius:12px;padding:10px}
.mid{font-family:monospace;color:#888;font-size:12px;margin-top:12px}
@media print{button{display:none}}</style></head><body>
<h2>${meeting.name}</h2>
<div class="sub">${meeting.date} ${meeting.time} ${meeting.venue ? "• " + meeting.venue : ""}</div>
<img src="${img}"/>
<p style="font-size:13px;color:#666;margin-top:12px">Scan this QR code to mark your attendance</p>
<div class="mid">${meeting.id}</div><br>
<button onclick="window.print()" style="padding:10px 26px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">Print</button>
</body></html>`);
    w.document.close();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-sm p-6 text-center">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-left">{meeting.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="inline-block rounded-xl border-4 border-gov-800 p-3 bg-white">
          <canvas ref={canvasRef} />
        </div>
        <p className="mt-3 text-xs font-mono text-slate-500 break-all">{url}</p>
        <p className="text-xs text-slate-400 mt-1">Meeting ID: {meeting.id}</p>
        <div className="flex gap-2 mt-5">
          <button onClick={download} className="btn btn-primary flex-1">
            Download PNG
          </button>
          <button onClick={print} className="btn btn-secondary flex-1">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
