"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    token: string | null;
    userName: string | null;
    userId: string | null;
    login: (token: string, name?: string, id?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Initial check from localStorage to persist real session
    useEffect(() => {
        const savedToken = localStorage.getItem('bodh_token');
        const savedName = localStorage.getItem('bodh_user_name');
        const savedId = localStorage.getItem('bodh_user_id');
        if (savedToken) {
            setToken(savedToken);
            setUserName(savedName);
            setUserId(savedId);
            setIsLoggedIn(true);
        }
    }, []);

    const login = (newToken: string, name?: string, id?: string) => {
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
        localStorage.setItem('bodh_token', newToken);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setToken(null);
        setUserName(null);
        setUserId(null);
        localStorage.removeItem('bodh_token');
        localStorage.removeItem('bodh_user_name');
        localStorage.removeItem('bodh_user_id');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, token, userName, userId, login, logout }}>
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
