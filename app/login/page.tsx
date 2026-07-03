"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gov-900 via-gov-800 to-gov-600 p-4">
      <div className="card w-full max-w-md p-8 !bg-white">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-gov-800 flex items-center justify-center text-white text-2xl font-bold">
            QR
          </div>
          <h1 className="text-xl font-bold text-gov-900">
            Meeting QR Attendance System
          </h1>
          <p className="text-sm text-slate-500 mt-1">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="label !text-slate-700">Username</label>
            <input
              className="input !bg-white !border-slate-300 !text-slate-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label !text-slate-700">Password</label>
            <div className="relative">
              <input
                className="input pr-12 !bg-white !border-slate-300 !text-slate-900"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-full py-2.5" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
