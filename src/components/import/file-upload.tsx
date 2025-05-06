'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportFormat } from '@/lib/import-types';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  acceptedFileTypes: string[];
  maxSize?: number;
}

export function FileUpload({
  onFileSelected,
  acceptedFileTypes,
  maxSize = 5 * 1024 * 1024 // 5MB default
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);

    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];

    // Check file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    onFileSelected(file);
  }, [onFileSelected, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false
  });

  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-gray-800 dark:text-gray-200">Upload File</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          Upload a CSV file from your bank
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400/50 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-blue-500 dark:text-blue-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <div className="text-gray-800 dark:text-gray-200 font-medium">
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <p>Drag & drop a file here, or click to select</p>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supported format: CSV
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maximum file size: {maxSize / (1024 * 1024)}MB
        </p>
      </CardFooter>
    </Card>
  );
}
