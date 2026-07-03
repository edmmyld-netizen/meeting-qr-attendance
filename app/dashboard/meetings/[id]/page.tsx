"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import MeetingForm from "@/components/MeetingForm";
import { Meeting } from "@/lib/types";

export default function EditMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((list: Meeting[]) => {
        const m = Array.isArray(list) ? list.find((x) => x.id === id) : undefined;
        if (m) setMeeting(m);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-1">Edit Meeting</h1>
      <p className="text-sm font-mono text-slate-400 mb-5">{id}</p>
      {notFound && <div className="card p-8 text-center text-slate-400">Meeting not found</div>}
      {meeting && (
        <MeetingForm
          initial={meeting}
          submitLabel="Save Changes"
          onSubmit={async (data) => {
            const res = await fetch(`/api/meetings/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const j = await res.json();
              throw new Error(j.error || "Failed to save");
            }
            router.push("/dashboard/meetings");
          }}
        />
      )}
    </Shell>
  );
}
