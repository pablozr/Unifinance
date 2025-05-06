import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/users/setup - Setup a new user
export async function POST(request: NextRequest) {
  console.log('User setup API called');

  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Missing or invalid authorization header');
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  if (!token) {
    console.error('No bearer token provided');
    return NextResponse.json({ error: 'Bearer token is required' }, { status: 401 });
  }

  // Create a Supabase client with the token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  // Get user data from the token
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user from token:', userError);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  console.log('User authenticated:', user.email);
  const userId = user.id;

  try {
    // Check if user already exists in the users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // If there's an error but it's not a "not found" error, throw it
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', checkError);
      return NextResponse.json({ error: 'Error checking user account' }, { status: 500 });
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      // Create user using RPC function to bypass RLS
      const { error: createError } = await supabase.rpc('create_user', {
        user_id: userId,
        user_email: user.email || ''
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      console.log('User created successfully');

      // Create default categories
      const { error: categoriesError } = await supabase.rpc('create_default_categories', {
        user_id: userId
      });

      if (categoriesError) {
        console.error('Error creating default categories:', categoriesError);
        // Don't fail the request if categories creation fails
      } else {
        console.log('Default categories created successfully');
      }

      return NextResponse.json({
        success: true,
        message: 'User account created successfully'
      });
    }

    // User already exists
    return NextResponse.json({
      success: true,
      message: 'User account already exists'
    });
  } catch (error) {
    console.error('Error in user setup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
