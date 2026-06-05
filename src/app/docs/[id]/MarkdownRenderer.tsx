"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy code"
      className="absolute top-2 right-2 flex items-center gap-xs px-sm py-1 rounded text-label-md transition-all"
      style={{
        background: copied ? "rgba(16,185,129,0.2)" : "var(--surface-variant)",
        color: copied ? "#10b981" : "var(--on-surface-variant)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "var(--outline)"}`,
        zIndex: 10,
      }}
    >
      <span className="material-symbols-outlined text-[14px]">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);

  const getTextContent = () => preRef.current?.textContent ?? "";

  return (
    <pre {...props} ref={preRef} className="relative group">
      <CopyButton getText={getTextContent} />
      {children}
    </pre>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ pre: Pre }}
    >
      {content}
    </ReactMarkdown>
  );
}
