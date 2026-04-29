import { memo } from "react";
import type { TrainerInfo } from "@/hooks/useChat";
import { getInitials } from "@/lib/utils";

interface Props {
  trainer: TrainerInfo | null;
}

export const ChatHeader = memo(function ChatHeader({ trainer }: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00E5FF]/10 text-xs font-bold text-[#00E5FF]">
        {getInitials(trainer?.full_name ?? null)}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{trainer?.full_name ?? "Tu entrenador"}</p>
        <p className="text-xs text-[#8B8BA3]">Conversación privada</p>
      </div>
      <div className="ml-auto flex h-2 w-2 rounded-full bg-[#00C853]" title="Activo" />
    </div>
  );
});
