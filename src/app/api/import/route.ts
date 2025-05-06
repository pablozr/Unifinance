import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transactionSchema } from '@/lib/validations';
import { z } from 'zod';

// POST /api/import - Import transactions
export async function POST(request: NextRequest) {
  console.log('Import API called');

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
    // Parse and validate request body
    const body = await request.json();

    // Validate the transactions array
    const transactionsSchema = z.array(transactionSchema);
    const validatedTransactions = transactionsSchema.parse(body.transactions);

    // Process transactions in batches to avoid hitting limits
    const batchSize = 100;
    const results = {
      inserted: 0,
      updated: 0,
      total: validatedTransactions.length
    };

    for (let i = 0; i < validatedTransactions.length; i += batchSize) {
      const batch = validatedTransactions.slice(i, i + batchSize).map(transaction => ({
        user_id: userId,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id,
        date: transaction.date,
        type: transaction.type,
      }));

      // For each transaction in the batch, check if it already exists
      for (const transaction of batch) {
        // Check if a transaction with the same date, description, and amount already exists
        const { data: existingTransactions, error: checkError } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('date', transaction.date)
          .eq('description', transaction.description)
          .eq('amount', transaction.amount);

        if (checkError) {
          console.error('Error checking for existing transaction:', checkError);
          continue;
        }

        if (existingTransactions && existingTransactions.length > 0) {
          // Transaction exists, update it
          const { data: updatedData, error: updateError } = await supabase
            .from('transactions')
            .update({
              category_id: transaction.category_id,
              type: transaction.type
            })
            .eq('id', existingTransactions[0].id)
            .select();

          if (updateError) {
            console.error('Error updating transaction:', updateError);
          } else {
            results.updated++;
          }
        } else {
          // Transaction doesn't exist, insert it
          const { data: insertedData, error: insertError } = await supabase
            .from('transactions')
            .insert([transaction])
            .select();

          if (insertError) {
            console.error('Error inserting transaction:', insertError);

            // If the error is related to the category_id, try to create the category
            if (insertError.message.includes('foreign key constraint') && insertError.message.includes('category_id')) {
              // Create default categories for the user
              for (const category of ['Other Income', 'Other Expenses']) {
                await supabase
                  .from('categories')
                  .insert({
                    user_id: userId,
                    name: category,
                    color: category.includes('Income') ? '#4CAF50' : '#F44336',
                    icon: 'circle'
                  });
              }

              // Try again with the default category
              const { data: defaultCategories } = await supabase
                .from('categories')
                .select('id, name')
                .eq('user_id', userId)
                .limit(2);

              if (defaultCategories && defaultCategories.length > 0) {
                // Update transaction with default category
                const updatedTransaction = {
                  ...transaction,
                  category_id: transaction.type === 'income'
                    ? defaultCategories.find(c => c.name === 'Other Income')?.id
                    : defaultCategories.find(c => c.name === 'Other Expenses')?.id
                };

                // Try inserting again
                const { data: retryData, error: retryError } = await supabase
                  .from('transactions')
                  .insert([updatedTransaction])
                  .select();

                if (retryError) {
                  console.error('Error inserting transaction with default category:', retryError);
                } else {
                  results.inserted++;
                }
              }
            }
          } else {
            results.inserted++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted: results.inserted,
      updated: results.updated,
      total: results.total,
      message: `Successfully processed ${results.total} transactions (${results.inserted} inserted, ${results.updated} updated)`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error importing transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
