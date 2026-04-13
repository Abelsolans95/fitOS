import type { League, LeagueParticipant, LeagueMetric, LeagueStatus } from "@fitos/shared";

export type LeaguesTab = "list" | "create";

export interface LeagueFormData {
  title: string;
  description: string;
  metric: LeagueMetric;
  custom_metric_name: string;
  starts_at: string;
  ends_at: string;
  prize: string;
}

export interface LeaguesState {
  loading: boolean;
  leagues: League[];
  gamificationEnabled: boolean;
  togglingGamification: boolean;
  activeTab: LeaguesTab;
  // Form
  form: LeagueFormData;
  creating: boolean;
  // Leaderboard
  selectedLeagueId: string | null;
  leaderboard: LeagueParticipant[];
  loadingLeaderboard: boolean;
  // Enroll
  enrolling: boolean;
  // Delete confirm
  confirmDeleteId: string | null;
  deleting: boolean;
}

export type LeaguesAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LEAGUES"; payload: League[] }
  | { type: "SET_GAMIFICATION_ENABLED"; payload: boolean }
  | { type: "SET_TOGGLING_GAMIFICATION"; payload: boolean }
  | { type: "SET_TAB"; payload: LeaguesTab }
  | { type: "SET_FORM_FIELD"; payload: { field: keyof LeagueFormData; value: string } }
  | { type: "RESET_FORM" }
  | { type: "SET_CREATING"; payload: boolean }
  | { type: "ADD_LEAGUE"; payload: League }
  | { type: "REMOVE_LEAGUE"; payload: string }
  | { type: "UPDATE_LEAGUE"; payload: League }
  | { type: "SET_SELECTED_LEAGUE"; payload: string | null }
  | { type: "SET_LEADERBOARD"; payload: LeagueParticipant[] }
  | { type: "SET_LOADING_LEADERBOARD"; payload: boolean }
  | { type: "SET_ENROLLING"; payload: boolean }
  | { type: "SET_CONFIRM_DELETE"; payload: string | null }
  | { type: "SET_DELETING"; payload: boolean };

export const EMPTY_FORM: LeagueFormData = {
  title: "",
  description: "",
  metric: "consistency",
  custom_metric_name: "",
  starts_at: "",
  ends_at: "",
  prize: "",
};

export function leaguesReducer(state: LeaguesState, action: LeaguesAction): LeaguesState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_LEAGUES":
      return { ...state, leagues: action.payload };
    case "SET_GAMIFICATION_ENABLED":
      return { ...state, gamificationEnabled: action.payload };
    case "SET_TOGGLING_GAMIFICATION":
      return { ...state, togglingGamification: action.payload };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_FORM_FIELD":
      return { ...state, form: { ...state.form, [action.payload.field]: action.payload.value } };
    case "RESET_FORM":
      return { ...state, form: EMPTY_FORM, creating: false };
    case "SET_CREATING":
      return { ...state, creating: action.payload };
    case "ADD_LEAGUE":
      return { ...state, leagues: [action.payload, ...state.leagues] };
    case "REMOVE_LEAGUE":
      return { ...state, leagues: state.leagues.filter((l) => l.id !== action.payload), confirmDeleteId: null };
    case "UPDATE_LEAGUE":
      return { ...state, leagues: state.leagues.map((l) => (l.id === action.payload.id ? action.payload : l)) };
    case "SET_SELECTED_LEAGUE":
      return { ...state, selectedLeagueId: action.payload, leaderboard: [], loadingLeaderboard: false };
    case "SET_LEADERBOARD":
      return { ...state, leaderboard: action.payload, loadingLeaderboard: false };
    case "SET_LOADING_LEADERBOARD":
      return { ...state, loadingLeaderboard: action.payload };
    case "SET_ENROLLING":
      return { ...state, enrolling: action.payload };
    case "SET_CONFIRM_DELETE":
      return { ...state, confirmDeleteId: action.payload };
    case "SET_DELETING":
      return { ...state, deleting: action.payload };
    default:
      return state;
  }
}

export const INITIAL_STATE: LeaguesState = {
  loading: true,
  leagues: [],
  gamificationEnabled: false,
  togglingGamification: false,
  activeTab: "list",
  form: EMPTY_FORM,
  creating: false,
  selectedLeagueId: null,
  leaderboard: [],
  loadingLeaderboard: false,
  enrolling: false,
  confirmDeleteId: null,
  deleting: false,
};
