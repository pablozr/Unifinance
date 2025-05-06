import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// DELETE /api/transactions/clear - Delete all transactions for a user
export async function DELETE(request: NextRequest) {
  console.log('Clear Transactions API called');

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

  console.log('Creating Supabase client with token');

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

  console.log('Getting user from token');

  // Get user data from the token
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user from token:', userError);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  console.log('User authenticated:', user.email);
  const userId = user.id;

  try {
    // Delete all transactions for the user
    const { data, error, count } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('Error deleting transactions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Deleted ${data?.length || 0} transactions for user ${userId}`);

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      message: `Successfully deleted ${data?.length || 0} transactions`
    });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
