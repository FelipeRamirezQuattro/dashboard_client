import React from "react";
import { Spinner } from "@odessa-separator/ui";

const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => (
  <div className="flex items-center justify-center">
    <Spinner size={size} label="Loading" />
  </div>
);

export default LoadingSpinner;
