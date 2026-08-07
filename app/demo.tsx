"use client";

import { useEffect } from "react";
import { initAmplitude, trackClient } from "@/lib/amplitude/client";

export function Demo() {
  useEffect(() => {
    void initAmplitude();
  }, []);

  return (
    <div className="flex gap-3">
      <button
        type="button"
        className="rounded-md border border-foreground/20 bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        onClick={() => trackClient("client_action")}
      >
        client event
      </button>
      <button
        type="button"
        className="rounded-md border border-foreground/20 bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        onClick={() => void fetch("/api/event", { method: "POST" })}
      >
        server event
      </button>
    </div>
  );
}
