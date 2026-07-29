"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FileUploadButton({ projectId }: { projectId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [kind, setKind] = useState("other");

  async function upload(file: File) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: file.name,
          type: file.type,
          size: file.size,
          kind
        })
      });
      const prepared = (await response.json()) as {
        preview?: boolean;
        error?: string;
        path?: string;
        token?: string;
      };
      if (!response.ok) throw new Error(prepared.error ?? "Upload was rejected.");
      if (prepared.preview) {
        setMessage("Preview: the file would now enter quarantine.");
        return;
      }
      if (!prepared.path || !prepared.token) throw new Error("Upload token is missing.");
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("quarantine")
        .uploadToSignedUrl(prepared.path, prepared.token, file, {
          contentType: file.type
        });
      if (error) throw error;
      setMessage("Uploaded to quarantine. It will appear after the security scan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.txt"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <select
        className="input w-auto min-w-36"
        aria-label="File purpose"
        value={kind}
        onChange={(event) => setKind(event.target.value)}
      >
        <option value="contract">Contract</option>
        <option value="quote">Quote</option>
        <option value="receipt">Receipt</option>
        <option value="message">Client message</option>
        <option value="other">Other</option>
      </select>
      <button className="button button-primary" disabled={pending} onClick={() => input.current?.click()}>
        <Upload size={16} /> {pending ? "Uploading…" : "Upload file"}
      </button>
      {message ? <p role="status" className="w-full max-w-md text-xs">{message}</p> : null}
    </div>
  );
}
