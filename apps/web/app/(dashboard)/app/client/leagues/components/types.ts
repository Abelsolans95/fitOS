import type { League, LeagueParticipant, Badge, UserBadge } from "@fitos/shared";

export type ClientLeaguesTab = "leagues" | "badges";

export interface ClientLeaguesState {
  loading: boolean;
  gamificationEnabled: boolean;
  leagues: League[];
  badges: Badge[];
  userBadges: UserBadge[];
  activeTab: ClientLeaguesTab;
  // Leaderboard
  selectedLeagueId: string | null;
  leaderboard: LeagueParticipant[];
  loadingLeaderboard: boolean;
  // Join
  joining: boolean;
}

export type ClientLeaguesAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_GAMIFICATION_ENABLED"; payload: boolean }
  | { type: "SET_LEAGUES"; payload: League[] }
  | { type: "SET_BADGES"; payload: Badge[] }
  | { type: "SET_USER_BADGES"; payload: UserBadge[] }
  | { type: "SET_TAB"; payload: ClientLeaguesTab }
  | { type: "SET_SELECTED_LEAGUE"; payload: string | null }
  | { type: "SET_LEADERBOARD"; payload: LeagueParticipant[] }
  | { type: "SET_LOADING_LEADERBOARD"; payload: boolean }
  | { type: "SET_JOINING"; payload: boolean };

export function clientLeaguesReducer(
  state: ClientLeaguesState,
  action: ClientLeaguesAction
): ClientLeaguesState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_GAMIFICATION_ENABLED":
      return { ...state, gamificationEnabled: action.payload };
    case "SET_LEAGUES":
      return { ...state, leagues: action.payload };
    case "SET_BADGES":
      return { ...state, badges: action.payload };
    case "SET_USER_BADGES":
      return { ...state, userBadges: action.payload };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_SELECTED_LEAGUE":
      return { ...state, selectedLeagueId: action.payload, leaderboard: [], loadingLeaderboard: false };
    case "SET_LEADERBOARD":
      return { ...state, leaderboard: action.payload, loadingLeaderboard: false };
    case "SET_LOADING_LEADERBOARD":
      return { ...state, loadingLeaderboard: action.payload };
    case "SET_JOINING":
      return { ...state, joining: action.payload };
    default:
      return state;
  }
}

export const CLIENT_INITIAL_STATE: ClientLeaguesState = {
  loading: true,
  gamificationEnabled: false,
  leagues: [],
  badges: [],
  userBadges: [],
  activeTab: "leagues",
  selectedLeagueId: null,
  leaderboard: [],
  loadingLeaderboard: false,
  joining: false,
};
