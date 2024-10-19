// src/hooks/useAuth.ts
import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const { user, registerUser, loginUser, logoutUser, error, clearError } = useAuthContext();

  return { user, registerUser, loginUser, logoutUser, error, clearError };
}
