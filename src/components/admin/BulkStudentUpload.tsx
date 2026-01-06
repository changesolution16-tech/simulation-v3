'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Users, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
  newUsers: string[];
}

const BulkStudentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/bulk-upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,name,role,cohort\nexample@domain.com,John Doe,learner,Cohort A\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-upload-template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 text-white p-3 rounded-lg">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bulk Student Upload</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Upload multiple students via CSV file</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">CSV Format Requirements</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Required columns: email, name, role (learner/instructor), cohort (optional)</li>
          <li>First row must be headers</li>
          <li>Email must be unique for each user</li>
          <li>Default password will be sent to each user via email</li>
        </ul>
        <button
          onClick={downloadTemplate}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {!file ? (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drop CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Maximum file size: 5MB
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 dark:text-green-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="w-5 h-5 inline mr-1" />
                Remove
              </button>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Students
              </>
            )}
          </button>
        )}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Results</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-900 dark:text-green-100">Successful</span>
              </div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{result.success}</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-900 dark:text-red-100">Failed</span>
              </div>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{result.failed}</p>
            </div>
          </div>

          {result.newUsers.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">New Users Created:</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {result.newUsers.map((email, index) => (
                    <li key={index}>• {email}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Errors:</h4>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BulkStudentUpload;
