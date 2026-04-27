import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

let _state: AuthState = {
  user: null,
  token: localStorage.getItem('safevision_token'),
  isAuthenticated: !!localStorage.getItem('safevision_token'),
};

const _listeners = new Set<() => void>();

export const authStore = {
  getState: () => _state,
  subscribe: (listener: () => void) => {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
  setUser: (user: User) => {
    _state = { ..._state, user, isAuthenticated: true };
    _listeners.forEach((l) => l());
  },
  setToken: (token: string) => {
    localStorage.setItem('safevision_token', token);
    _state = { ..._state, token, isAuthenticated: true };
    _listeners.forEach((l) => l());
  },
  logout: () => {
    localStorage.removeItem('safevision_token');
    _state = { user: null, token: null, isAuthenticated: false };
    _listeners.forEach((l) => l());
  },
};
