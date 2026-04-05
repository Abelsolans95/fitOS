export interface Message {
  id: string;
  trainer_id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface TrainerInfo {
  user_id: string;
  full_name: string | null;
}

export type ListItem =
  | { type: "separator"; day: string; label: string }
  | { type: "message"; data: Message };

export function getInitials(name: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
