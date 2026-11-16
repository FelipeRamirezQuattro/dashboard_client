import React from "react";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { buttonVariants, EmptyState } from "@odessa-separator/ui";

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={<SearchX size={48} />}
        title="404 - Page Not Found"
        titleAs="h2"
        description="The page you're looking for doesn't exist or has been moved."
      >
        <Link to="/dashboard" className={buttonVariants()}>
          Go to Dashboard
        </Link>
      </EmptyState>
    </div>
  );
};

export default NotFound;
