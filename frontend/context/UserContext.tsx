"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAvatarById } from '@/components/Arena/AvatarPicker';

export interface UserProfile {
    displayName: string;
    avatarId: string;
}

interface UserContextType {
    profile: UserProfile | null;
    hasProfile: boolean;
    setProfile: (profile: UserProfile) => void;
    updateProfile: (partial: Partial<UserProfile>) => void;
    // Keep these shims so existing code that reads userName doesn't break
    userName: string | null;
    avatarId: string;
    historyCodes: string[];
    addHistoryCode: (code: string) => void;
    removeHistoryCode: (code: string) => void;
}

const STORAGE_KEY = 'bodh_user_profile';
const HISTORY_KEY = 'bodh_history_codes';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [profile, setProfileState] = useState<UserProfile | null>(null);
    const [historyCodes, setHistoryCodes] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setProfileState(JSON.parse(saved)); } catch { /* ignore */ }
        }
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
            try { setHistoryCodes(JSON.parse(savedHistory)); } catch { /* ignore */ }
        }
    }, []);

    const setProfile = (newProfile: UserProfile) => {
        setProfileState(newProfile);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
        }
    };

    const updateProfile = (partial: Partial<UserProfile>) => {
        setProfileState(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...partial };
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const addHistoryCode = (code: string) => {
        setHistoryCodes(prev => {
            const next = [code, ...prev.filter(c => c !== code)].slice(0, 20);
            if (typeof window !== 'undefined') {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            }
            return next;
        });
    };

    const removeHistoryCode = (code: string) => {
        setHistoryCodes(prev => {
            const next = prev.filter(c => c !== code);
            if (typeof window !== 'undefined') {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            }
            return next;
        });
    };

    return (
        <UserContext.Provider value={{
            profile,
            hasProfile: !!profile,
            setProfile,
            updateProfile,
            userName: profile?.displayName ?? null,
            avatarId: profile?.avatarId ?? 'A1',
            historyCodes,
            addHistoryCode,
            removeHistoryCode,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
