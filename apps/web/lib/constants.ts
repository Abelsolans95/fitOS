// ─── Query limits ────────────────────────────────────────────────────────────
// Centralized limits for Supabase queries. Change here to affect all queries.

export const QUERY_LIMITS = {
  /** Chat messages per conversation */
  MESSAGES: 500,
  /** Appointments per calendar view */
  APPOINTMENTS: 200,
  /** Community posts per feed load */
  COMMUNITY_POSTS: 50,
  /** Community comments per post batch */
  COMMUNITY_COMMENTS: 500,
  /** Weight log entries per exercise analytics */
  WEIGHT_LOG: 200,
  /** Weight log entries for full analytics */
  WEIGHT_LOG_ANALYTICS: 500,
  /** Body metrics history */
  BODY_METRICS: 30,
  /** Support tickets per inbox */
  TICKETS: 200,
  /** Ticket replies per thread */
  TICKET_REPLIES: 200,
  /** Knowledge articles per page */
  KNOWLEDGE_ARTICLES: 100,
  /** Food log — filtered by day, no hard limit needed */
  /** Calendar entries per month (workout logs, food logs) */
  CALENDAR_ENTRIES: 200,
  /** Body metrics for calendar view */
  CALENDAR_BODY_METRICS: 100,
  /** Exercises per page in library browser */
  EXERCISES_PAGE: 50,
  /** Workout sessions per client history (trainer view) */
  WORKOUT_SESSIONS: 20,
  /** Dashboard calendar/food log recent entries */
  DASHBOARD_RECENT: 30,
  /** Ticket replies when building article from ticket */
  TICKET_REPLIES_PREVIEW: 50,
  /** Knowledge article suggestions in ticket creation */
  KNOWLEDGE_SUGGESTIONS: 3,
  /** Contracts per trainer/client view */
  CONTRACTS: 200,
  /** Contract templates per trainer */
  CONTRACT_TEMPLATES: 50,
} as const;
