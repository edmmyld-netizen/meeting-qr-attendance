"use client";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import MeetingForm from "@/components/MeetingForm";

export default function NewMeetingPage() {
  const router = useRouter();

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-5">Create New Meeting</h1>
      <MeetingForm
        submitLabel="Create Meeting"
        onSubmit={async (data) => {
          const res = await fetch("/api/meetings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const j = await res.json();
            throw new Error(j.error || "Failed to create meeting");
          }
          router.push("/dashboard/meetings");
        }}
      />
    </Shell>
  );
}
