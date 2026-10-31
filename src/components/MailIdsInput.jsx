import React, { useRef, useState } from "react";

// A box that holds several e-mail addresses as chips (Vendor Master > Mail ID).
//   value     the addresses as one text: "a@x.com; b@y.com" (what is saved)
//   onChange  (text) => void, with the same "a@x.com; b@y.com" form
//   maxLength the longest text that can be saved (the database column holds 500)
// Type or paste an address and press Enter, comma, semicolon or space: it becomes a chip. Backspace on an empty box removes the last
// chip. A wrong address stays in the box with a message; the same address twice is added once.

const VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "a@x.com; b@y.com, c@z.com" -> ["a@x.com", "b@y.com", "c@z.com"]
export const parseMailIds = (text) => String(text || "").split(/[;,\s]+/).map((s) => s.trim()).filter(Boolean);
const joinIds = (ids) => ids.join("; ");

const MailIdsInput = ({ label = "Mail ID", value, onChange, maxLength = 500, disabled = false }) => {
  const ids = parseMailIds(value);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const commit = (raw) => {
    const parts = parseMailIds(raw);
    if (parts.length === 0) {
      setDraft("");
      setError("");
      return;
    }
    const next = [...ids];
    const bad = [];
    parts.forEach((p) => {
      if (!VALID.test(p)) bad.push(p);
      else if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    });
    if (joinIds(next).length > maxLength) {
      setDraft(raw);
      setError(`Too long: all the mail ids together can be ${maxLength} characters at most.`);
      return;
    }
    onChange(joinIds(next));
    setDraft(bad.join(" "));
    setError(bad.length ? `Not a valid e-mail address: ${bad.join(", ")}` : "");
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setError("");
    // a separator (typed or pasted) finishes the address(es) typed so far
    if (/[;,\s]/.test(text)) commit(text);
    else setDraft(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && ids.length > 0) {
      onChange(joinIds(ids.slice(0, -1)));
    }
  };

  const used = joinIds(ids).length;

  return (
    <div>
      <div className="mb-1 text-[11px] font-medium text-[#6b7280]">{label}</div>
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 transition-colors ${
          error ? "border-[#d32f2f]" : "border-[#c4c9d4] hover:border-[#0066FF] focus-within:border-[#0066FF]"
        } ${disabled ? "pointer-events-none opacity-60" : "cursor-text"}`}
      >
        {ids.map((id) => (
          <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#eef4ff] py-0.5 pl-2.5 pr-1 text-[12px] text-[#1d4ed8]">
            <span className="truncate">{id}</span>
            <button
              type="button"
              aria-label={`Remove ${id}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(joinIds(ids.filter((x) => x !== id)));
              }}
              className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-[14px] leading-none text-[#1d4ed8] hover:bg-[#c9dcff]"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={ids.length ? "Add another address" : "name@company.com"}
          className="min-w-[150px] flex-1 border-0 bg-transparent p-0 text-[13px] text-[#1a2233] outline-none placeholder:text-[#a4a9b3]"
        />
      </div>
      <div className="mt-1 flex items-start justify-between gap-3 text-[11px]">
        <span className={error ? "text-[#d32f2f]" : "text-[#8a93a3]"}>{error || "Press Enter, comma or space after each address."}</span>
        <span className={`shrink-0 ${used > maxLength * 0.9 ? "text-[#b45309]" : "text-[#8a93a3]"}`}>{used}/{maxLength}</span>
      </div>
    </div>
  );
};

export default MailIdsInput;
