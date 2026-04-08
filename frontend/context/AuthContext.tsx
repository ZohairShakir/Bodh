"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    token: string | null;
    userName: string | null;
    userId: string | null;
    profile: any | null;
    login: (token: string, name?: string, id?: string, profile?: any) => void;
    updateProfile: (newProfile: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<any | null>(null);

    // Initial check from localStorage to persist real session
    useEffect(() => {
        const savedToken = localStorage.getItem('bodh_token');
        const savedName = localStorage.getItem('bodh_user_name');
        const savedId = localStorage.getItem('bodh_user_id');
        const savedProfile = localStorage.getItem('bodh_profile');
        
        if (savedToken) {
            setToken(savedToken);
            setUserName(savedName);
            setUserId(savedId);
            if (savedProfile) setProfile(JSON.parse(savedProfile));
            setIsLoggedIn(true);
        }
    }, []);

    const login = (newToken: string, name?: string, id?: string, newProfile?: any) => {
        setIsLoggedIn(true);
        setToken(newToken);
        if (name) {
            setUserName(name);
            localStorage.setItem('bodh_user_name', name);
        }
        if (id) {
            setUserId(id);
            localStorage.setItem('bodh_user_id', id);
        }
        if (newProfile) {
            setProfile(newProfile);
            localStorage.setItem('bodh_profile', JSON.stringify(newProfile));
        }
        localStorage.setItem('bodh_token', newToken);
    };

    const updateProfile = (newProfile: any) => {
        const updated = { ...profile, ...newProfile };
        setProfile(updated);
        localStorage.setItem('bodh_profile', JSON.stringify(updated));
    };

    const logout = () => {
        setIsLoggedIn(false);
        setToken(null);
        setUserName(null);
        setUserId(null);
        setProfile(null);
        localStorage.removeItem('bodh_token');
        localStorage.removeItem('bodh_user_name');
        localStorage.removeItem('bodh_user_id');
        localStorage.removeItem('bodh_profile');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, token, userName, userId, profile, login, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
