import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4"
    >
      <div className="mb-8">
        <div className="inline-block p-4 bg-amber-100 rounded-full">
          <AlertTriangle className="w-16 h-16 text-amber-600" />
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Page Not Found</h1>
      
      <p className="text-gray-600 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved to another location.
      </p>
      
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
      >
        <Home className="w-5 h-5 mr-2" />
        Return Home
      </button>
    </motion.div>
  );
};

export default NotFound;