"use client";

import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { MessageInput } from "./components/MessageInput";

export default function ClientChatPage() {
  const { messages, trainer, clientId, clientIdRef, input, setInput, sending, loading, error, handleSend } = useChat();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Chat</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">Mensajes con tu entrenador</p>
      </div>

      <div className="flex h-[620px] flex-col rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
        <ChatHeader trainer={trainer} />
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          <MessageList messages={messages} clientId={clientId} clientIdRef={clientIdRef} trainer={trainer} />
        </div>
        <MessageInput input={input} sending={sending} onChange={setInput} onSend={handleSend} />
      </div>
    </div>
  );
}
