"use client";

import { useEffect } from "react";

function sendEvent(payload: Record<string, string>) {
  void fetch("/api/site-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

export default function SiteMonitor() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      sendEvent({
        type: "crash",
        path: window.location.pathname,
        message: event.message || "Unknown error",
        stack: event.error?.stack || "",
        userAgent: navigator.userAgent,
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || "Unhandled promise rejection";

      sendEvent({
        type: "crash",
        path: window.location.pathname,
        message: reason,
        stack: event.reason?.stack || "",
        userAgent: navigator.userAgent,
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
