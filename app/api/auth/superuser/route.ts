import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("llmorc");

    const existingUser = await db.collection('users').findOne({ username: "administrator" });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Super User administrator already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword("Access123$");
    const user = {
      username: "administrator",
      password: hashedPassword,
      name: "SuperUser",
      role: 'superuser',
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