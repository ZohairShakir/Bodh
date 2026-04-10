"use client";

import React from 'react';
import { User, Cat, Dog, Bird, Ghost, Rocket, Star, Heart, Cloud, Moon, Sun, Zap } from 'lucide-react';

const AVATARS = [
    { id: 'A1', icon: <User size={24} />, color: 'bg-blue-500' },
    { id: 'A2', icon: <Cat size={24} />, color: 'bg-orange-500' },
    { id: 'A3', icon: <Dog size={24} />, color: 'bg-brown-500' },
    { id: 'A4', icon: <Bird size={24} />, color: 'bg-green-500' },
    { id: 'A5', icon: <Ghost size={24} />, color: 'bg-purple-500' },
    { id: 'A6', icon: <Rocket size={24} />, color: 'bg-red-500' },
    { id: 'A7', icon: <Star size={24} />, color: 'bg-yellow-500' },
    { id: 'A8', icon: <Heart size={24} />, color: 'bg-pink-500' },
    { id: 'A9', icon: <Cloud size={24} />, color: 'bg-sky-500' },
    { id: 'A10', icon: <Moon size={24} />, color: 'bg-slate-700' },
    { id: 'A11', icon: <Sun size={24} />, color: 'bg-amber-400' },
    { id: 'A12', icon: <Zap size={24} />, color: 'bg-yellow-600' },
];

interface AvatarPickerProps {
    selectedId: string;
    onSelect: (id: string) => void;
}

export default function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
    return (
        <div className="grid grid-cols-4 gap-4 p-2">
            {AVATARS.map((avatar) => (
                <button
                    key={avatar.id}
                    onClick={() => onSelect(avatar.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        selectedId === avatar.id 
                            ? `${avatar.color} ring-4 ring-white/20 scale-110 shadow-lg` 
                            : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/40 hover:text-white/80'
                    }`}
                >
                    {React.cloneElement(avatar.icon as React.ReactElement, { 
                        className: selectedId === avatar.id ? 'text-white' : '' 
                    })}
                </button>
            ))}
        </div>
    );
}

export const getAvatarById = (id: string) => {
    return AVATARS.find(a => a.id === id) || AVATARS[0];
};
