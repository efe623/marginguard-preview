"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FileUploadButton({ projectId }: { projectId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

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
          size: file.size
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
    <div>
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
      <button className="button button-primary" disabled={pending} onClick={() => input.current?.click()}>
        <Upload size={16} /> {pending ? "Uploading…" : "Upload file"}
      </button>
      {message ? <p role="status" className="mt-2 max-w-xs text-xs">{message}</p> : null}
    </div>
  );
}
