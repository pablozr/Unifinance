'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

export default function SetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupCategories = async () => {
    if (!user) {
      toast.error('You must be logged in to set up categories');
      return;
    }

    setIsLoading(true);

    try {
      // Get direct API token
      let token = '';

      try {
        // Ask user for password to get a direct token
        const password = prompt('Please enter your password to authenticate this operation:');

        if (!password) {
          toast.error('Password is required for this operation');
          setIsLoading(false);
          return;
        }

        const tokenResponse = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            password
          })
        });

        if (!tokenResponse.ok) {
          const tokenError = await tokenResponse.json();
          throw new Error(tokenError.error || 'Authentication failed');
        }

        const tokenData = await tokenResponse.json();
        token = tokenData.access_token;
      } catch (tokenError) {
        console.error('Error getting token:', tokenError);
        toast.error('Authentication failed. Please check your password and try again.');
        setIsLoading(false);
        return;
      }

      // Now try to set up categories with the token
      const response = await fetch('/api/categories/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check for specific error types
        if (response.status === 401) {
          toast.error('Authentication error. Please log out and log back in.');
          setTimeout(() => {
            router.push('/auth/login?redirect=/setup');
          }, 2000);
          return;
        }

        throw new Error(errorData.error || 'Failed to set up categories');
      }

      toast.success('Categories set up successfully');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error setting up categories:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set up categories');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 flex flex-col">
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">UniFinance Setup</h1>

        <div className="space-y-8">
          <Card className="border border-blue-500/20 bg-blue-900/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Database Setup</CardTitle>
              <CardDescription className="text-blue-300/80">
                Instructions for setting up the database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-100">
                To set up the database for UniFinance, you need to run the SQL script provided in the project.
              </p>

              <div className="p-4 bg-blue-800/20 rounded-md border border-blue-500/20">
                <h3 className="text-lg font-medium text-blue-100 mb-2">Steps to Set Up the Database:</h3>
                <ol className="list-decimal list-inside text-blue-300/80 space-y-2">
                  <li>Log in to your Supabase dashboard</li>
                  <li>Go to the SQL Editor</li>
                  <li>Copy the contents of the <code className="bg-blue-800/40 px-1 rounded">simple_setup.sql</code> file</li>
                  <li>Paste the SQL into the editor and run it</li>
                  <li>Return to this page and click the "Set Up Categories" button below</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-800/20 rounded-md border border-blue-500/20 mt-4">
                <h3 className="text-lg font-medium text-blue-100 mb-2">Common SQL Errors and Solutions:</h3>
                <ul className="list-disc list-inside text-blue-300/80 space-y-2">
                  <li>
                    <strong className="text-blue-200">Permission denied to set parameter:</strong>
                    <span className="ml-2">This is normal and can be ignored. The script will still create the necessary tables.</span>
                  </li>
                  <li>
                    <strong className="text-blue-200">Relation already exists:</strong>
                    <span className="ml-2">This means the table already exists, which is fine. The script uses IF NOT EXISTS to avoid errors.</span>
                  </li>
                  <li>
                    <strong className="text-blue-200">Policy already exists:</strong>
                    <span className="ml-2">The script drops existing policies before creating new ones, so this shouldn't happen.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 p-4 rounded-md border border-yellow-500/20">
                <p className="text-yellow-400 font-medium">Important Note</p>
                <p className="text-blue-300/80 text-sm mt-1">
                  Make sure you have created the necessary tables before using the application. If you encounter errors about missing tables or unauthorized access, it's likely that the database setup is incomplete.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSetupCategories}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-t-white border-white/30 animate-spin inline-block"></span>
                    Setting Up...
                  </>
                ) : (
                  'Set Up Categories'
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border border-blue-500/20 bg-blue-900/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Troubleshooting</CardTitle>
              <CardDescription className="text-blue-300/80">
                Common issues and solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-100">401 Unauthorized Error</h3>
                  <p className="text-blue-300/80">
                    This usually means your authentication session has expired. Try logging out and logging back in.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-blue-100">404 Not Found Error</h3>
                  <p className="text-blue-300/80">
                    This typically indicates that the required database tables don't exist. Make sure you've run the setup SQL script.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-blue-100">Missing Categories</h3>
                  <p className="text-blue-300/80">
                    If you don't see any categories in the app, click the "Set Up Categories" button above to create the default categories.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-blue-500/30 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100"
              >
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
