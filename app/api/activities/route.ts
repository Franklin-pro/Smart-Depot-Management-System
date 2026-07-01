import { NextRequest, NextResponse } from 'next/server';
import type { Activity } from '@/lib/types';

// In-memory storage (use database in production)
let activities: Activity[] = [];

// GET /api/activities - Get all activities
export async function GET() {
  return NextResponse.json(activities);
}

// POST /api/activities - Create a new activity
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newActivity: Activity = {
    id: `a${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
  };
  
  activities.unshift(newActivity);
  
  return NextResponse.json(newActivity, { status: 201 });
}
