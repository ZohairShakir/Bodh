import { UserModel } from './models';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name?: string;
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return null;
    return {
        id: user._id.toString(),
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name
    };
};

export const addUser = async (userData: User): Promise<User> => {
    const user = new UserModel({
        email: userData.email.toLowerCase(),
        passwordHash: userData.passwordHash,
        name: userData.name
    });
    const saved = await user.save();
    return {
        id: saved._id.toString(),
        email: saved.email,
        passwordHash: saved.passwordHash,
        name: saved.name
    };
};
