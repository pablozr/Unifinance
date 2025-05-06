import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { categorySchema } from '@/services/category-service';
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

// GET /api/categories - Get all categories for the current user
export async function GET(request: NextRequest) {
  const result = await getAuthenticatedClient(request);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { supabase, userId } = result;

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  // Build query
  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by type if provided
  if (type) {
    const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];

    if (type === 'income') {
      return NextResponse.json({
        data: data.filter(category => incomeCategories.includes(category.name))
      });
    } else if (type === 'expense') {
      return NextResponse.json({
        data: data.filter(category => !incomeCategories.includes(category.name))
      });
    }
  }

  return NextResponse.json({ data });
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  const result = await getAuthenticatedClient(request);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { supabase, userId } = result;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // Create category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: validatedData.name,
        color: validatedData.color,
        icon: validatedData.icon,
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
