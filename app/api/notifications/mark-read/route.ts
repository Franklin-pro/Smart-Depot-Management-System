import { NextRequest, NextResponse } from 'next/server';
import { seedNotifications } from '@/lib/mock-data';

// In-memory storage (use database in production)
let notifications = [...seedNotifications];

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { notificationIds } = body;
  
  if (notificationIds && Array.isArray(notificationIds)) {
    // Mark specific notifications as read
    notificationIds.forEach(id => {
      const index = notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications[index].read = true;
      }
    });
  } else {
    // Mark all notifications as read
    notifications = notifications.map(n => ({ ...n, read: true }));
  }
  
  return NextResponse.json({ success: true, updated: notifications.length });
}
