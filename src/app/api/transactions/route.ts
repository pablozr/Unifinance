import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transactionSchema } from '@/lib/validations';
import { z } from 'zod';

// Helper function to get authenticated Supabase client
const getAuthenticatedClient = async (request: NextRequest) => {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization header is required', status: 401 };
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Bearer token is required', status: 401 };
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
    return { error: 'Invalid token', status: 401 };
  }

  return { supabase, userId: user.id };
};

// GET /api/transactions - Get all transactions for the current user
export async function GET(request: NextRequest) {
  const result = await getAuthenticatedClient(request);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { supabase, userId } = result;

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  // Build query
  let query = supabase
    .from('transactions')
    .select(`
      id,
      user_id,
      amount,
      description,
      category_id,
      date,
      type,
      created_at
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  // Apply filters if provided
  if (year && month) {
    // Filter by year and month
    const monthStartDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const monthEndDate = new Date(parseInt(year), parseInt(month), 0).toISOString();
    query = query.gte('date', monthStartDate).lte('date', monthEndDate);
  } else if (year) {
    // Filter by year only
    const yearStartDate = new Date(parseInt(year), 0, 1).toISOString();
    const yearEndDate = new Date(parseInt(year), 11, 31).toISOString();
    query = query.gte('date', yearStartDate).lte('date', yearEndDate);
  } else if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate && !year && !month) {
    query = query.lte('date', endDate);
  }

  if (category) {
    query = query.eq('category_id', category);
  }

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  const result = await getAuthenticatedClient(request);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { supabase, userId } = result;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    // Create transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: validatedData.amount,
        description: validatedData.description,
        category_id: validatedData.category_id,
        date: validatedData.date.toISOString(),
        type: validatedData.type,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
