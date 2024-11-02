import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 12);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  return sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  try {
    return verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};