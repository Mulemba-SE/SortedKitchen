// Single place that knows where the login token lives.
// "Remember me" ON  -> localStorage   (survives closing the browser)
// "Remember me" OFF -> sessionStorage (cleared when the tab/browser closes)
const TOKEN_KEY = 'adminToken';

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const getToken = () =>
  safe(() => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY));

export const clearToken = () => {
  safe(() => localStorage.removeItem(TOKEN_KEY));
  safe(() => sessionStorage.removeItem(TOKEN_KEY));
};

export const setToken = (token, remember = true) => {
  clearToken();
  safe(() => (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token));
};

// Reads the role out of the JWT payload (display/routing only; the server still enforces roles).
export const getTokenRole = (token = getToken()) => {
  if (!token) return null;
  return safe(() => {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded))?.role || null;
  });
};
