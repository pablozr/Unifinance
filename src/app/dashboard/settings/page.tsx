'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryService } from '@/services';
import { Category as DBCategory } from '@/lib/supabase';
import { Input } from '@/components/ui/input';

// Settings interface
interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  default_view: string;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#4CAF50',
    icon: 'circle',
  });
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    user_id: '',
    currency: 'USD',
    notifications_enabled: true,
    email_notifications: false,
    default_view: 'dashboard',
    created_at: '',
    updated_at: '',
  });
  
  // Load user settings
  const loadUserSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user settings from the database
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Set settings data or defaults
      if (data) {
        setSettings(data);
      }
      
      // Load categories
      const userCategories = await categoryService.getUserCategories(user.id);
      setCategories(userCategories);
      
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load settings when user changes
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);
  
  // Handle settings update
  const handleUpdateSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update settings in the database
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          id: settings.id || undefined,
          user_id: user.id,
          currency: settings.currency,
          notifications_enabled: settings.notifications_enabled,
          email_notifications: settings.email_notifications,
          default_view: settings.default_view,
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Update settings state with the returned data
      if (data && data.length > 0) {
        setSettings(data[0]);
      }
      
      toast.success('Settings updated successfully');
      
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!newCategory.name) {
      toast.error('Category name is required');
      return;
    }
    
    setIsSaving(true);
    try {
      // Create new category
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            user_id: user.id,
            name: newCategory.name,
            color: newCategory.color,
            icon: newCategory.icon,
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Reset form
      setNewCategory({
        name: '',
        color: '#4CAF50',
        icon: 'circle',
      });
      
      // Reload categories
      const userCategories = await categoryService.getUserCategories(user.id);
      setCategories(userCategories);
      
      toast.success('Category added successfully');
      
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle deleting a category
  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Delete category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) {
        throw error;
      }
      
      // Reload categories
      const userCategories = await categoryService.getUserCategories(user.id);
      setCategories(userCategories);
      
      toast.success('Category deleted successfully');
      
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your app preferences and settings
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
            Categories
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4 space-y-6">
          {/* General Settings */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">General Settings</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Configure your basic app preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {/* Currency Setting */}
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Currency
                    </Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(value) => setSettings({ ...settings, currency: value })}
                    >
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                        <SelectItem value="BRL">Brazilian Real (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Default View Setting */}
                  <div className="space-y-2">
                    <Label htmlFor="default_view" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Default View
                    </Label>
                    <Select
                      value={settings.default_view}
                      onValueChange={(value) => setSettings({ ...settings, default_view: value })}
                    >
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <SelectValue placeholder="Select default view" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="budgets">Budgets</SelectItem>
                        <SelectItem value="reports">Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Notification Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Notifications</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Enable Notifications
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Receive notifications about your finances
                        </p>
                      </div>
                      <Switch
                        id="notifications_enabled"
                        checked={settings.notifications_enabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email_notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Notifications
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email_notifications"
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                        disabled={!settings.notifications_enabled}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleUpdateSettings}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-4 space-y-6">
          {/* Appearance Settings */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Appearance</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Customize the look and feel of the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Setting */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Theme</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } cursor-pointer`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="h-20 w-20 rounded-md bg-white border border-gray-200 mb-2 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-500"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" />
                        <path d="M12 20v2" />
                        <path d="m4.93 4.93 1.41 1.41" />
                        <path d="m17.66 17.66 1.41 1.41" />
                        <path d="M2 12h2" />
                        <path d="M20 12h2" />
                        <path d="m6.34 17.66-1.41 1.41" />
                        <path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Light</span>
                  </div>
                  
                  <div
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } cursor-pointer`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="h-20 w-20 rounded-md bg-gray-800 border border-gray-700 mb-2 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-400"
                      >
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Dark</span>
                  </div>
                  
                  <div
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                      theme === 'system'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } cursor-pointer`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="h-20 w-20 rounded-md bg-gradient-to-br from-white to-gray-800 border border-gray-200 mb-2 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-600"
                      >
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" x2="16" y1="21" y2="21" />
                        <line x1="12" x2="12" y1="17" y2="21" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">System</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4 space-y-6">
          {/* Categories Management */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Categories</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Manage your transaction categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {/* Add New Category */}
                  <form onSubmit={handleAddCategory} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Add New Category</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="category_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category Name
                      </Label>
                      <Input
                        id="category_name"
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        placeholder="e.g., Groceries, Entertainment"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="category_color" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: newCategory.color }}
                        />
                        <Input
                          id="category_color"
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="h-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
                      disabled={isSaving || !newCategory.name}
                    >
                      {isSaving ? 'Adding...' : 'Add Category'}
                    </Button>
                  </form>
                  
                  {/* Categories List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Your Categories</h3>
                    
                    {categories.length > 0 ? (
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-gray-800 dark:text-gray-200">{category.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={isSaving}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No custom categories found. Add a category to get started.
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
