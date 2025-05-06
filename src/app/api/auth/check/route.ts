import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/auth/check - Check if user is authenticated
export async function GET() {
  // Create a Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        persistSession: false
      }
    }
  );

  // Check if user is authenticated
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error checking authentication:', error);
    return NextResponse.json({ error: 'Error checking authentication' }, { status: 500 });
  }
  
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  return NextResponse.json({ 
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email
    }
  });
}
