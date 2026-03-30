import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'users.json');

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name?: string;
}

export const loadUsers = (): User[] => {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading users:", error);
        return [];
    }
};

export const saveUsers = (users: User[]) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error saving users:", error);
    }
};

export const findUserByEmail = (email: string): User | undefined => {
    const users = loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const addUser = (user: User) => {
    const users = loadUsers();
    users.push(user);
    saveUsers(users);
};
