// src/app/api/user-limit/route.ts
import { NextResponse } from 'next/server';
import { canCreateNewUser, getCurrentUserCount, getMaxUsers } from '@/lib/user-limit';

export async function GET() {
  try {
    const result = await canCreateNewUser();
    const currentCount = await getCurrentUserCount();
    const maxUsers = getMaxUsers();
    
    return NextResponse.json({
      ...result,
      currentCount,
      maxUsers,
      remainingSlots: Math.max(0, maxUsers - currentCount)
    });
  } catch (error) {
    console.error('Error checking user limit:', error);
    return NextResponse.json(
      { 
        allowed: true, // Default to allowing signup if check fails
        message: 'Unable to verify user capacity, but registration is open',
        currentCount: 0,
        maxUsers: getMaxUsers(),
        remainingSlots: getMaxUsers()
      },
      { status: 200 }
    );
  }
}
