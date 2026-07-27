import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyableCell({ value, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div
      className="group/copy flex items-center gap-1.5 cursor-pointer"
      onClick={handleCopy}
      title="Click to copy"
    >
      <span>{children}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}