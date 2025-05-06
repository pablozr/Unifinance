import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/spending-by-category - Get spending by category for the current user
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Get all transactions
  let query = supabase
    .from('transactions')
    .select(`
      amount,
      category_id,
      type
    `)
    .eq('user_id', userId)
    .eq('type', 'expense');

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data: transactions, error: transactionsError } = await query;

  if (transactionsError) {
    return NextResponse.json({ error: transactionsError.message }, { status: 500 });
  }

  // Get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, color')
    .eq('user_id', userId);

  if (categoriesError) {
    return NextResponse.json({ error: categoriesError.message }, { status: 500 });
  }

  // Group by category and calculate totals
  const spendingByCategory: Record<string, number> = {};
  let totalExpenses = 0;

  transactions.forEach(transaction => {
    const { category_id, amount } = transaction;
    if (!spendingByCategory[category_id]) {
      spendingByCategory[category_id] = 0;
    }
    spendingByCategory[category_id] += amount;
    totalExpenses += amount;
  });

  // Convert to array and calculate percentages
  const result = Object.entries(spendingByCategory).map(([category_id, amount]) => {
    const category = categories.find(c => c.id === category_id) || { name: 'Uncategorized', color: '#9E9E9E' };

    return {
      category_id,
      category_name: category.name,
      category_color: category.color,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ data: result });
}
