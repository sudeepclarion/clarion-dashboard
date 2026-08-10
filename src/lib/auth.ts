const STORAGE_KEY = "clarion_dashboard_token";
const TEAM_KEY = "clarion_active_team_id";

export const getSessionToken = (): string | null => localStorage.getItem(STORAGE_KEY);

export const setSessionToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEY, token.trim());
};

export const clearSessionToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = (): boolean => Boolean(getSessionToken());

export const getActiveTeamId = (): string | null => localStorage.getItem(TEAM_KEY);

export const setActiveTeamId = (teamId: string): void => {
  localStorage.setItem(TEAM_KEY, teamId);
};

export const clearActiveTeamId = (): void => {
  localStorage.removeItem(TEAM_KEY);
};
