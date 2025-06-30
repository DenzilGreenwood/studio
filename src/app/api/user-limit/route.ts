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
      remainingSlots: maxUsers - currentCount
    });
  } catch (error) {
    console.error('Error checking user limit:', error);
    return NextResponse.json(
      { 
        allowed: false, 
        message: 'Unable to verify user capacity. Please try again later.' 
      },
      { status: 500 }
    );
  }
}
