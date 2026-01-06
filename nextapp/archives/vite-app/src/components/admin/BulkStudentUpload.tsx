import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import { UserService } from '../../lib/users';

interface CSVStudent {
  email: string;
  password: string;
  full_name: string;
  institution?: string;
  department?: string;
  position?: string;
}

interface BulkStudentUploadProps {
  onClose: () => void;
  onComplete: () => void;
}

const BulkStudentUpload: React.FC<BulkStudentUploadProps> = ({ onClose, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<CSVStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });
  const [showResults, setShowResults] = useState(false);

  const downloadTemplate = () => {
    const csvContent = 'email,password,full_name,institution,department,position\nstudent1@example.com,password123,John Doe,Tech University,Computer Science,Student\nstudent2@example.com,password123,Jane Smith,Tech University,Engineering,Student';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedStudents = result.data as CSVStudent[];
        setStudents(parsedStudents);
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message);
      }
    });
  };

  const validateStudents = (): string[] => {
    const errors: string[] = [];
    const emails = new Set<string>();

    students.forEach((student, index) => {
      const row = index + 2;

      if (!student.email || !student.email.includes('@')) {
        errors.push(`Row ${row}: Invalid or missing email`);
      }

      if (!student.password || student.password.length < 6) {
        errors.push(`Row ${row}: Password must be at least 6 characters`);
      }

      if (!student.full_name || student.full_name.trim() === '') {
        errors.push(`Row ${row}: Full name is required`);
      }

      if (emails.has(student.email)) {
        errors.push(`Row ${row}: Duplicate email ${student.email}`);
      }
      emails.add(student.email);
    });

    return errors;
  };

  const handleBulkUpload = async () => {
    const validationErrors = validateStudents();
    if (validationErrors.length > 0) {
      setResults({
        success: 0,
        failed: validationErrors.length,
        errors: validationErrors
      });
      setShowResults(true);
      return;
    }

    setIsProcessing(true);
    const uploadResults = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const student of students) {
      try {
        const result = await UserService.createUser({
          email: student.email,
          password: student.password,
          full_name: student.full_name,
          role: 'student',
          institution: student.institution,
          department: student.department,
          position: student.position || 'Student'
        });

        if (result.user) {
          uploadResults.success++;
        } else {
          uploadResults.failed++;
          uploadResults.errors.push(`${student.email}: ${result.error}`);
        }
      } catch (error) {
        uploadResults.failed++;
        uploadResults.errors.push(`${student.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setResults(uploadResults);
    setShowResults(true);
    setIsProcessing(false);

    if (uploadResults.success > 0) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Bulk Student Upload</h2>
            <p className="text-sm text-gray-600 mt-1">Upload multiple students from a CSV file</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!showResults ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Required columns: email, password, full_name</li>
                      <li>Optional columns: institution, department, position</li>
                      <li>Password must be at least 6 characters</li>
                      <li>Email must be unique and valid</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download CSV Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">
                    {file ? file.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </label>
              </div>

              {students.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FileText className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Preview: {students.length} students</h3>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Institution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 10).map((student, index) => (
                          <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2">{student.email}</td>
                            <td className="px-3 py-2">{student.full_name}</td>
                            <td className="px-3 py-2">{student.institution || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {students.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        ... and {students.length - 10} more students
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={students.length === 0 || isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${students.length} Students`
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-6">
                {results.success > 0 && results.failed === 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Successful!</h3>
                    <p className="text-gray-600">
                      Successfully created {results.success} student account{results.success > 1 ? 's' : ''}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full mb-4">
                      <AlertCircle className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Complete with Errors</h3>
                    <p className="text-gray-600">
                      Success: {results.success} | Failed: {results.failed}
                    </p>
                  </div>
                )}
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Errors ({results.errors.length})
                  </h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {results.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setStudents([]);
                    setFile(null);
                    setResults({ success: 0, failed: 0, errors: [] });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Upload More
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BulkStudentUpload;
