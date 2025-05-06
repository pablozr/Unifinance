'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function TestDashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Log user information for debugging
    console.log('User in test dashboard:', user);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="border border-blue-500/20 bg-blue-900/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Test Dashboard</CardTitle>
          <CardDescription className="text-blue-300/80">
            This is a simple test dashboard to verify authentication is working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-800/20 rounded-md">
              <h3 className="text-lg font-medium text-white mb-2">User Information</h3>
              {user ? (
                <div className="space-y-2">
                  <p className="text-blue-100">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-blue-100">
                    <span className="font-medium">User ID:</span> {user.id}
                  </p>
                  <p className="text-blue-100">
                    <span className="font-medium">Authentication Status:</span> Authenticated
                  </p>
                </div>
              ) : (
                <p className="text-red-400">Not authenticated. You should not be able to see this page.</p>
              )}
            </div>
            
            <div className="p-4 bg-blue-800/20 rounded-md">
              <h3 className="text-lg font-medium text-white mb-2">Authentication Test</h3>
              <p className="text-blue-300/80 mb-4">
                If you can see this page, it means the authentication and middleware are working correctly.
                The middleware is successfully checking for the authentication cookie and allowing you to access this protected route.
              </p>
              
              <Button 
                onClick={handleSignOut}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-blue-500/30 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100"
          >
            Go to Main Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
