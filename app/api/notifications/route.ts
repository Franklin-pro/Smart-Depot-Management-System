import { NextRequest, NextResponse } from 'next/server';
import type { AppNotification } from '@/lib/types';

// In-memory storage (use database in production)
let notifications: AppNotification[] = [];

// GET /api/notifications - Get all notifications
export async function GET() {
  return NextResponse.json(notifications);
}

// POST /api/notifications/generate - Generate a new notification
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { level, title, message } = body;
  
  const newNotification: AppNotification = {
    id: `n${Date.now()}`,
    level: level || 'info',
    title: title || 'Notification',
    message: message || '',
    createdAt: new Date().toISOString(),
    read: false,
  };
  
  notifications.unshift(newNotification);
  
  return NextResponse.json(newNotification, { status: 201 });
}
