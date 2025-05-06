import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

// Login request schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    // Only check rate limit in production environment
    if (process.env.NODE_ENV === 'production') {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(request);

      // If rate limit exceeded, return 429 Too Many Requests
      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            error: 'Too many login attempts. Please try again later.',
            retryAfter: rateLimitResult.reset
          },
          {
            status: 429,
            headers: {
              'Retry-After': `${rateLimitResult.reset}`,
              'X-RateLimit-Limit': `${rateLimitResult.limit}`,
              'X-RateLimit-Remaining': `${rateLimitResult.remaining}`,
              'X-RateLimit-Reset': `${rateLimitResult.reset}`
            }
          }
        );
      }
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      // Return validation errors
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    // Extract validated data
    const { email, password } = result.data;

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication error
    if (error) {
      console.error('Authentication error occurred');

      // Return generic error message to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    // Return generic error message
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
