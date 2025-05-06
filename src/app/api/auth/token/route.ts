import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/token - Get a token for direct API access
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error signing in:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    if (!data.session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    
    // Return the session token
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    });
  } catch (error) {
    console.error('Error in token API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
