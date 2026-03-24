/**
 * Email notifications via Resend
 *
 * PENDIENTE DE CONFIGURACIÓN:
 * 1. Tener un dominio propio verificado en Resend (resend.com/domains)
 * 2. Obtener RESEND_API_KEY desde resend.com/api-keys
 * 3. Añadir RESEND_API_KEY a .env.local y a Vercel environment variables
 * 4. Configurar RESEND_FROM_EMAIL=citas@tu-dominio.com
 *
 * Una vez configurado, instalar: npm install resend --legacy-peer-deps
 * Y descomentar el código de abajo.
 *
 * Esta función se llama desde API routes (server-side), nunca desde el frontend.
 */

export interface AppointmentEmailData {
  to: string;           // email del destinatario
  recipientName: string;
  trainerName: string;
  clientName: string;
  appointmentTitle: string;
  sessionType: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  meetingUrl?: string;
  notes?: string;
  status: "confirmed" | "cancelled" | "pending";
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  presencial: "Sesión presencial",
  online: "Sesión online",
  telefonica: "Llamada telefónica",
  evaluacion: "Evaluación inicial",
  seguimiento: "Seguimiento",
};

/**
 * Envía email de confirmación de cita al cliente y/o entrenador.
 *
 * ESTADO: STUB — no envía emails hasta que Resend esté configurado.
 * Cuando esté configurado:
 *   1. npm install resend --legacy-peer-deps (en apps/web)
 *   2. import { Resend } from "resend"
 *   3. const resend = new Resend(process.env.RESEND_API_KEY)
 *   4. Reemplazar el bloque TODO con la llamada real a resend.emails.send()
 */
export async function sendAppointmentEmail(data: AppointmentEmailData): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "citas@fitOS.app";

  if (!apiKey) {
    // En desarrollo, loguear el email en consola en lugar de enviarlo
    console.log("[Email STUB] Appointment notification:", {
      to: data.to,
      from: fromEmail,
      subject: getEmailSubject(data),
      body: getEmailTextBody(data),
    });
    return { sent: false, error: "RESEND_API_KEY no configurada — email no enviado (solo log)" };
  }

  // TODO: Descomentar cuando Resend esté configurado:
  // const resend = new Resend(apiKey);
  // const { error } = await resend.emails.send({
  //   from: fromEmail,
  //   to: data.to,
  //   subject: getEmailSubject(data),
  //   html: getEmailHtmlBody(data),
  //   text: getEmailTextBody(data),
  // });
  // if (error) return { sent: false, error: error.message };
  // return { sent: true };

  return { sent: false, error: "Resend pendiente de configuración" };
}

function getEmailSubject(data: AppointmentEmailData): string {
  const typeLabel = SESSION_TYPE_LABELS[data.sessionType] ?? data.sessionType;
  switch (data.status) {
    case "confirmed":
      return `✅ Cita confirmada: ${data.appointmentTitle} — ${formatDateTime(data.startsAt)}`;
    case "cancelled":
      return `❌ Cita cancelada: ${data.appointmentTitle}`;
    case "pending":
      return `📅 Nueva solicitud de cita: ${data.appointmentTitle}`;
    default:
      return `FitOS: ${typeLabel} — ${data.appointmentTitle}`;
  }
}

function getEmailTextBody(data: AppointmentEmailData): string {
  const typeLabel = SESSION_TYPE_LABELS[data.sessionType] ?? data.sessionType;
  const lines: string[] = [
    `Hola ${data.recipientName},`,
    "",
    data.status === "confirmed"
      ? `Tu cita ha sido confirmada.`
      : data.status === "cancelled"
      ? `La cita ha sido cancelada.`
      : `Tienes una nueva solicitud de cita.`,
    "",
    `Cita: ${data.appointmentTitle}`,
    `Tipo: ${typeLabel}`,
    `Entrenador: ${data.trainerName}`,
    `Cliente: ${data.clientName}`,
    `Inicio: ${formatDateTime(data.startsAt)}`,
    `Fin: ${formatDateTime(data.endsAt)}`,
  ];

  if (data.location) lines.push(`Lugar: ${data.location}`);
  if (data.meetingUrl) lines.push(`Enlace: ${data.meetingUrl}`);
  if (data.notes) lines.push(`Notas: ${data.notes}`);

  lines.push("", "El equipo de FitOS");

  return lines.join("\n");
}

/**
 * HTML template para email de cita — pendiente diseño final con Resend
 * Se usará cuando el MCP de Resend esté configurado con dominio verificado.
 */
function getEmailHtmlBody(data: AppointmentEmailData): string {
  const typeLabel = SESSION_TYPE_LABELS[data.sessionType] ?? data.sessionType;

  const statusColor = data.status === "confirmed"
    ? "#00C853"
    : data.status === "cancelled"
    ? "#FF1744"
    : "#FF9100";

  const statusText = data.status === "confirmed"
    ? "Confirmada"
    : data.status === "cancelled"
    ? "Cancelada"
    : "Pendiente";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FitOS — Cita</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
        Fit<span style="color:#00E5FF;">OS</span>
      </span>
    </div>

    <!-- Card -->
    <div style="background:#12121A;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;">
      <div style="display:inline-block;background:${statusColor}20;border:1px solid ${statusColor}40;border-radius:8px;padding:4px 12px;margin-bottom:24px;">
        <span style="color:${statusColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${statusText}</span>
      </div>

      <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 8px;">${data.appointmentTitle}</h1>
      <p style="color:#8B8BA3;font-size:14px;margin:0 0 24px;">${typeLabel}</p>

      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;display:flex;flex-direction:column;gap:12px;">
        <div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Entrenador</span>
          <p style="color:#ffffff;font-size:14px;font-weight:600;margin:4px 0 0;">${data.trainerName}</p>
        </div>
        <div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Cliente</span>
          <p style="color:#ffffff;font-size:14px;font-weight:600;margin:4px 0 0;">${data.clientName}</p>
        </div>
        <div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Inicio</span>
          <p style="color:#00E5FF;font-size:14px;font-weight:600;margin:4px 0 0;">${formatDateTime(data.startsAt)}</p>
        </div>
        <div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Fin</span>
          <p style="color:#ffffff;font-size:14px;margin:4px 0 0;">${formatDateTime(data.endsAt)}</p>
        </div>
        ${data.location ? `<div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Lugar</span>
          <p style="color:#ffffff;font-size:14px;margin:4px 0 0;">${data.location}</p>
        </div>` : ""}
        ${data.meetingUrl ? `<div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Enlace</span>
          <p style="margin:4px 0 0;"><a href="${data.meetingUrl}" style="color:#00E5FF;font-size:14px;">${data.meetingUrl}</a></p>
        </div>` : ""}
        ${data.notes ? `<div>
          <span style="color:#5A5A72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Notas</span>
          <p style="color:#8B8BA3;font-size:14px;margin:4px 0 0;">${data.notes}</p>
        </div>` : ""}
      </div>
    </div>

    <!-- Footer -->
    <p style="color:#5A5A72;font-size:12px;text-align:center;margin-top:24px;">
      FitOS — La plataforma para entrenadores y clientes
    </p>
  </div>
</body>
</html>`;
}
