import { NextRequest, NextResponse } from 'next/server';
import { seedUsers } from '@/lib/mock-data';
import type { User } from '@/lib/types';

// In-memory storage (use database in production)
let users = [...seedUsers];

// GET /api/users - Get all users
export async function GET() {
  return NextResponse.json(users);
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newUser: User = {
    id: `u${Date.now()}`,
    ...body,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  
  return NextResponse.json(newUser, { status: 201 });
}
