"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    token: string | null;
    userName: string | null;
    login: (token: string, name?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

    // Initial check from localStorage to persist real session
    useEffect(() => {
        const savedToken = localStorage.getItem('bodh_token');
        const savedName = localStorage.getItem('bodh_user_name');
        if (savedToken) {
            setToken(savedToken);
            setUserName(savedName);
            setIsLoggedIn(true);
        }
    }, []);

    const login = (newToken: string, name?: string) => {
        setIsLoggedIn(true);
        setToken(newToken);
        if (name) {
            setUserName(name);
            localStorage.setItem('bodh_user_name', name);
        }
        localStorage.setItem('bodh_token', newToken);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setToken(null);
        setUserName(null);
        localStorage.removeItem('bodh_token');
        localStorage.removeItem('bodh_user_name');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, token, userName, login, logout }}>
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
