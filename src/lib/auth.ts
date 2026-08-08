const STORAGE_KEY = "clarion_dashboard_token";

export const getSessionToken = (): string | null => localStorage.getItem(STORAGE_KEY);

export const setSessionToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEY, token.trim());
};

export const clearSessionToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = (): boolean => Boolean(getSessionToken());
