import React from 'react';

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center">
        {/* Modern Animated Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-secondary/20 border-b-secondary rounded-full animate-spin-slow"></div>
        </div>
        
        {/* Text with Fade-in Effect */}
        <h2 className="text-lg font-semibold text-slate-700 animate-pulse">
          Nexus ERP yuklanmoqda...
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          Ma'lumotlar xavfsiz holatda tayyorlanmoqda
        </p>
      </div>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
