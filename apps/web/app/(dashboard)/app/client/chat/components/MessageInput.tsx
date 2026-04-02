import { memo } from "react";

interface Props {
  input: string;
  sending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export const MessageInput = memo(function MessageInput({ input, sending, onChange, onSend }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  return (
    <div className="border-t border-white/[0.06] p-4">
      <div className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje… (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/40 focus:bg-white/[0.06] transition-all max-h-32 overflow-y-auto"
          style={{ minHeight: "44px" }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-white transition-all hover:bg-[#7C3AED]/80 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-[#5A5A72]">Shift+Enter para salto de línea</p>
    </div>
  );
});
