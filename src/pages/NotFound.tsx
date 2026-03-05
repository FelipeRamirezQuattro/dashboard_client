import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-osi-bg flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-osi-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-osi-dark mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
