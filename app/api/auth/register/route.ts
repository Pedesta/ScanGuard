import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password, name } = await request.json();
    const client = await clientPromise;
    const db = client.db("llmorc");

    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = {
      username,
      password: hashedPassword,
      name,
      role: 'user',
      createdAt: new Date(),
    };

    await db.collection('users').insertOne(user);
    return NextResponse.json({ message: 'User created successfully' });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}