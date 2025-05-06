'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { FileUpload } from '@/components/import/file-upload';
import { ImportMapping } from '@/components/import/import-mapping';
import { importService } from '@/services/import-service';
import { ImportedTransaction, BANK_TEMPLATES } from '@/lib/import-types';
import { supabase } from '@/lib/supabase';
import { categoryService, transactionService } from '@/services';

// Simplified category interface for import page
interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type?: 'income' | 'expense';
}

export default function ImportPage() {
  const { user } = useAuth();

  // State for the import process
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload');
  const [importedTransactions, setImportedTransactions] = useState<ImportedTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(BANK_TEMPLATES[0].id);

  // State for import results
  const [importResult, setImportResult] = useState<{
    inserted: number;
    updated: number;
    total: number;
  }>({ inserted: 0, updated: 0, total: 0 });

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // These variables are used in the component but ESLint doesn't detect it
  // We're keeping them and using setters in various handlers
  const [file, setFile] = useState<File | null>(null);

  // Load categories from database
  useEffect(() => {
    if (!user) return;

    const loadCategories = async () => {
      try {
        console.log('Loading categories from database...');
        setIsLoading(true);

        // First, ensure the user is set up properly using our API
        console.log('Setting up user account...');
        try {
          // Get authentication token
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;

          if (!token) {
            console.error('No authentication token available');
            toast.error('Authentication error. Please log out and log back in.');
            return;
          }

          // Call our user setup API
          const response = await fetch('/api/users/setup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error setting up user:', errorData);
            toast.error('Failed to set up user account');
            return;
          }

          const result = await response.json();
          console.log('User setup result:', result);
        } catch (setupError) {
          console.error('Error in user setup process:', setupError);
          toast.error('Failed to set up user account');
          return;
        }

        // Now fetch categories
        const { data: categoriesData, error } = await supabase
          .from('categories')
          .select('id, name, color, icon')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading categories:', error);
          toast.error('Failed to load categories');
          return;
        }

        if (!categoriesData || categoriesData.length === 0) {
          console.log('No categories found, creating default categories...');

          // Create default categories if none exist
          const defaultCategories = [
            // Income categories
            { name: 'Salary', color: '#4CAF50', icon: 'briefcase', type: 'income' },
            { name: 'Freelance', color: '#8BC34A', icon: 'code', type: 'income' },
            { name: 'Investments', color: '#009688', icon: 'trending-up', type: 'income' },
            { name: 'Other Income', color: '#9C27B0', icon: 'plus-circle', type: 'income' },

            // Expense categories
            { name: 'Housing', color: '#F44336', icon: 'home', type: 'expense' },
            { name: 'Food', color: '#FF9800', icon: 'shopping-cart', type: 'expense' },
            { name: 'Transportation', color: '#795548', icon: 'car', type: 'expense' },
            { name: 'Utilities', color: '#607D8B', icon: 'zap', type: 'expense' },
            { name: 'Healthcare', color: '#00BCD4', icon: 'activity', type: 'expense' },
            { name: 'Entertainment', color: '#673AB7', icon: 'film', type: 'expense' },
            { name: 'Shopping', color: '#3F51B5', icon: 'shopping-bag', type: 'expense' },
            { name: 'Other Expenses', color: '#9E9E9E', icon: 'more-horizontal', type: 'expense' }
          ];

          // Insert default categories
          try {
            // Insert all categories at once
            const { error } = await supabase.from('categories').insert(
              defaultCategories.map(category => ({
                user_id: user.id,
                name: category.name,
                color: category.color,
                icon: category.icon
              }))
            );

            if (error) {
              console.warn('Error creating categories:', error.message);
              toast.error('Failed to create default categories');
            } else {
              console.log('Successfully inserted default categories');
              toast.success('Default categories created');
            }
          } catch (insertError) {
            console.error('Error inserting default categories:', insertError);
            toast.error('Failed to create categories');
          }

          // Fetch the newly created categories
          const { data: newCategories, error: fetchError } = await supabase
            .from('categories')
            .select('id, name, color, icon')
            .eq('user_id', user.id);

          if (fetchError) {
            console.error('Error fetching new categories:', fetchError);
            toast.error('Failed to create default categories');
            return;
          }

          console.log(`Created ${newCategories?.length || 0} default categories`);
          setCategories(newCategories || []);
        } else {
          console.log(`Loaded ${categoriesData.length} categories from database`);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error in category loading process:', error);
        toast.error('Failed to set up categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [user]);

  // Handle file selection
  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);

    // Determine file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'csv') {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsLoading(true);

    try {
      // Get format from selected template
      const format = BANK_TEMPLATES.find(t => t.id === selectedTemplate)?.format || BANK_TEMPLATES[0].format;

      // Parse CSV file
      const transactions = await importService.parseCSV(selectedFile, format);

      // Normalize transactions
      try {
        const normalizedTransactions = importService.normalizeTransactions(transactions, format);
        setImportedTransactions(normalizedTransactions);
        setImportStep('mapping');
      } catch (normalizeError) {
        console.error('Error normalizing transactions:', normalizeError);
        toast.error('Error processing transactions. Please try a different file or format.');
        throw normalizeError;
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('There was an error reading your file. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle import confirmation
  const handleImportConfirm = async (mappedTransactions: any[]) => {
    if (!user) {
      toast.error('You must be logged in to import transactions');
      return;
    }

    setImportStep('importing');
    setIsLoading(true);

    try {
      console.log('Starting import process with', mappedTransactions.length, 'transactions');

      // Get authentication token
      let token = '';

      try {
        // Get current session token
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || '';

        if (!token) {
          toast.error('Authentication error. Please log out and log back in.');
          setImportStep('mapping');
          setIsLoading(false);
          return;
        }

        console.log('Using current session token for import');
      } catch (tokenError) {
        console.error('Error getting session token:', tokenError);
        toast.error('Authentication failed. Please try logging out and back in.');
        setImportStep('mapping');
        setIsLoading(false);
        return;
      }

      // Validate transactions
      console.log('Validating transactions...');
      const validTransactions = mappedTransactions.filter(transaction => {
        // Make sure all required fields are present
        if (!transaction.amount || !transaction.description || !transaction.date) {
          console.warn('Invalid transaction missing required fields:', transaction);
          return false;
        }

        // Make sure category_id is valid
        if (!transaction.category_id) {
          console.warn('Transaction missing category_id:', transaction);
          // If no category is selected, use the first available category
          if (categories.length > 0) {
            transaction.category_id = categories[0].id;
            console.log('Assigned default category:', categories[0].id);
            return true;
          } else {
            console.error('No categories available to assign');
            return false;
          }
        }

        return true;
      });

      console.log('Validated transactions:', validTransactions.length, 'of', mappedTransactions.length);

      if (validTransactions.length === 0) {
        toast.error('No valid transactions to import');
        setImportStep('mapping');
        setIsLoading(false);
        return;
      }

      // Log the first few transactions for debugging
      console.log('Sample transactions to import:', validTransactions.slice(0, 3));

      // Send transactions to API
      console.log('Sending import request to API...');
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactions: validTransactions }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Import API error:', errorData);

        // Check for specific error types
        if (response.status === 401) {
          toast.error('Authentication error. Please log out and log back in.');
        } else if (response.status === 404) {
          toast.error('Resource not found. Database tables may not be set up correctly.');
        } else if (response.status === 400 && errorData.error) {
          // Handle validation errors
          if (Array.isArray(errorData.error)) {
            // If it's an array of errors, show the first one
            toast.error(`Validation error: ${errorData.error[0]?.message || 'Invalid data'}`);
            console.error('Validation errors:', errorData.error);
          } else if (typeof errorData.error === 'object') {
            // If it's an object, convert to string
            toast.error(`Error: ${JSON.stringify(errorData.error)}`);
          } else {
            // If it's a string or other primitive
            toast.error(`Error: ${errorData.error}`);
          }
        } else {
          toast.error('Failed to import transactions');
        }

        setImportStep('mapping');
      } else {
        const result = await response.json();
        console.log('Import successful:', result);

        setImportStep('complete');

        // Store the result in state to display in the UI
        setImportResult({
          inserted: result.inserted || 0,
          updated: result.updated || 0,
          total: result.total || 0
        });

        if (result.updated > 0) {
          toast.success(`Successfully processed ${result.total} transactions (${result.inserted} new, ${result.updated} updated)`);
        } else {
          toast.success(`Successfully imported ${result.inserted} transactions`);
        }

        // Get the month and year from the imported transactions
        const getMonthYearFromTransactions = (transactions: any[]) => {
          // Default to current month/year if no transactions
          if (!transactions || transactions.length === 0) {
            const now = new Date();
            return { month: now.getMonth() + 1, year: now.getFullYear() };
          }

          // Find the most recent transaction date
          let mostRecentDate = new Date(0); // Start with epoch

          transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate > mostRecentDate) {
              mostRecentDate = transactionDate;
            }
          });

          return {
            month: mostRecentDate.getMonth() + 1, // 1-12
            year: mostRecentDate.getFullYear()
          };
        };

        // Get month/year from the imported transactions
        const { month, year } = getMonthYearFromTransactions(validTransactions);

        // Redirect to dashboard after a short delay with the correct month/year
        setTimeout(() => {
          console.log(`Redirecting to dashboard for ${year}/${month}...`);
          // Get the router instance
          const { refresh, push } = useRouter();
          refresh(); // Force refresh the router cache

          // Use query parameters to set the month/year in the dashboard
          const searchParams = new URLSearchParams();
          searchParams.set('year', year.toString());
          searchParams.set('month', month.toString());

          push(`/dashboard?${searchParams.toString()}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import transactions');
      setImportStep('mapping');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset all state variables
    setFile(null);
    setImportedTransactions([]);
    setImportStep('upload');

    // Log the current state for debugging
    console.log('Import cancelled. Current file:', file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">Import Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Import transactions from your bank statements
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => useRouter().push('/dashboard')}
          className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
          <TabsTrigger value="import" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Import
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Help
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          {importStep === 'upload' && (
            <>
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm mb-4">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-gray-800 dark:text-gray-200 text-lg">Select Bank Template</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Choose the bank template that matches your statement format
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {BANK_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedTemplate === template.id
                            ? 'bg-blue-600/20 dark:bg-blue-600/30 border-blue-500 dark:border-blue-400'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-500/50 dark:hover:border-blue-400/50'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">{template.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.id === 'custom' ? 'Custom format' : 'Pre-configured format'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {isLoading ? (
                <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-blue-200 dark:border-blue-400 dark:border-gray-600 animate-spin mb-4"></div>
                    <p className="text-gray-800 dark:text-gray-200 font-medium">Processing file...</p>
                  </CardContent>
                </Card>
              ) : (
                <FileUpload
                  onFileSelected={handleFileSelected}
                  acceptedFileTypes={['.csv', 'text/csv']}
                  maxSize={10 * 1024 * 1024} // 10MB
                />
              )}
            </>
          )}

          {importStep === 'mapping' && (
            <ImportMapping
              transactions={importedTransactions}
              categories={categories}
              onConfirm={handleImportConfirm}
              onCancel={handleCancel}
            />
          )}

          {importStep === 'importing' && (
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-gray-800 dark:text-gray-200">Importing Transactions</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Please wait while we import your transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-blue-200 dark:border-blue-400 dark:border-gray-600 animate-spin mb-4"></div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">Importing {importedTransactions.length} transactions...</p>
              </CardContent>
            </Card>
          )}

          {importStep === 'complete' && (
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-gray-800 dark:text-gray-200">Import Complete</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Your transactions have been successfully imported
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-green-500 dark:text-green-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-gray-800 dark:text-gray-200 font-medium text-xl mb-2">Import Successful</p>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Successfully processed {importResult.total} transactions
                </p>
                <div className="flex gap-4 text-sm">
                  <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 font-medium text-lg">{importResult.inserted}</span>
                    <span className="text-green-600 dark:text-green-400">New transactions</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">{importResult.updated}</span>
                    <span className="text-blue-600 dark:text-blue-400">Updated transactions</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <Button
                  onClick={() => useRouter().push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Return to Dashboard
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-800 dark:text-gray-200">How to Import Transactions</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Learn how to import transactions from your bank
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Supported File Formats</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  UniFinance supports importing transactions from CSV files. Most banks allow you to export your transactions in this format.
                </p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">CSV Import</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <strong>CSV files</strong> provide reliable results as they contain structured data that's easy to parse.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Most banks allow you to export your transactions as CSV files from your online banking portal.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    If your bank doesn't offer CSV export, you may need to manually convert your statement to CSV format.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">CSV Format Tips</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  For best results with CSV imports:
                </p>
                <ol className="list-decimal list-inside text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Make sure your CSV has headers (column names)</li>
                  <li>Ensure it contains at least date, description, and amount columns</li>
                  <li>Select the appropriate bank template that matches your CSV format</li>
                  <li>If no template matches, use the "Personalizado" (Custom) template</li>
                </ol>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  The import tool will try to automatically detect and normalize dates and amounts.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Step 1: Export from Your Bank</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Log in to your online banking portal and look for an option to export or download your transactions. Choose CSV format if available, as it's easier to parse accurately.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Step 2: Upload the File</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Upload the exported file using the file uploader on the Import tab. Select the appropriate bank template that matches your bank's export format.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Step 3: Review and Categorize</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Review the imported transactions and assign the correct categories. UniFinance will try to automatically categorize your transactions based on the description.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Step 4: Confirm Import</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Once you're satisfied with the categorization, click the Import button to add the transactions to your account.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Supported Banks</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  UniFinance has pre-configured templates for the following banks:
                </p>
                <ul className="list-disc list-inside text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Nubank</li>
                  <li>Itaú</li>
                  <li>Bradesco</li>
                  <li>Santander</li>
                  <li>Banco do Brasil</li>
                </ul>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  If your bank is not listed, you can use the "Custom" template and configure it manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



