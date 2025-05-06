'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // User profile state
  const [profile, setProfile] = useState({
    full_name: '',
    display_name: '',
    email: '',
    avatar_url: '',
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // Load user profile
  const loadUserProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user profile from the database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Set profile data
      setProfile({
        full_name: data?.full_name || '',
        display_name: data?.display_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        avatar_url: data?.avatar_url || '',
      });
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);
  
  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success('Profile updated successfully');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsSaving(true);
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });
      
      if (error) {
        throw error;
      }
      
      // Reset form
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      toast.success('Password updated successfully');
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate user initials for avatar
  const userInitials = profile.display_name
    ? profile.display_name.substring(0, 2).toUpperCase()
    : profile.email
    ? profile.email.substring(0, 2).toUpperCase()
    : 'U';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Profile Information</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Update your account profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your email address cannot be changed
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="full_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <Input
                    id="full_name"
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="display_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name
                  </label>
                  <Input
                    id="display_name"
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This is how your name will appear in the app
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        {/* Change Password */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Change Password</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="current_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Password
                </label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="new_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="confirm_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
                disabled={isSaving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Account Danger Zone */}
        <Card className="border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-200 dark:border-red-800 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all of your data
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
