import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Settings, Video, FileText, GitBranch, BarChart3 } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(`/admin/${path}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Settings className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Portal</span>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/admin/flow-builder"
                  className={`${
                    isActive('flow-builder')
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Flow Builder
                </Link>

                <Link
                  to="/admin/scenarios"
                  className={`${
                    isActive('scenarios')
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Scenarios
                </Link>

                <Link
                  to="/admin/videos"
                  className={`${
                    isActive('videos')
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Videos
                </Link>

                <Link
                  to="/admin/analytics"
                  className={`${
                    isActive('analytics')
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;