import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { categoryService } from '@/services';

// POST /api/categories/setup - Setup default categories for a user
export async function POST(request: NextRequest) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  if (!token) {
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

  const userId = user.id;

  try {
    // Create default categories - the service will handle checking if the user exists
    // and creating them if needed, as well as checking for existing categories
    await categoryService.createDefaultCategories(userId, user.email);

    return NextResponse.json({
      success: true,
      message: 'Categories setup completed successfully'
    });
  } catch (error) {
    console.error('Error setting up categories:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }, { status: 500 });
  }
}
