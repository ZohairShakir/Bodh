// AuthContext is deprecated — all auth has been removed.
// This file re-exports from UserContext for backward compatibility only.
// TODO: Replace all `useAuth` imports with `useUser` from '@/context/UserContext'
export { useUser as useAuth, UserProvider as AuthProvider } from './UserContext';
