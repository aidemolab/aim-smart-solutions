"use client";

import { useRef, useState } from "react";
import { basePath } from "@/lib/base-path";

// "Watch the 1-minute demo" link that plays a demo video in a modal (native <dialog>:
// Esc closes it and focus returns to the link). The video only loads once opened.
export default function VideoModalLink({ video, title, label = "Watch the 1-minute demo" }: { video: string; title: string; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" className="video-link" aria-haspopup="dialog" onClick={() => { setOpen(true); dialog.current?.showModal(); }}>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="8" fill="currentColor" /><path d="M6.4 4.9v6.2L11.2 8z" fill="#fff" /></svg>
        {label}
      </button>
      <dialog
        ref={dialog}
        className="video-modal"
        aria-label={`${title}: 1-minute demo video`}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="video-modal-inner">
          <div className="video-modal-head">
            <p>{title}</p>
            <button type="button" className="video-modal-close" onClick={close} aria-label="Close video">×</button>
          </div>
          {open && (
            <video controls preload="metadata" playsInline poster={`${basePath}/assets/videos/${video}-poster.jpg`} aria-label={`Narrated 1-minute video demo of the ${title}, with captions`}>
              <source src={`${basePath}/assets/videos/${video}.mp4`} type="video/mp4" />
            </video>
          )}
        </div>
      </dialog>
    </>
  );
}
