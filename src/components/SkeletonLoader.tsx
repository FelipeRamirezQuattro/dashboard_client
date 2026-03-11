import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}) => {
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "skeleton-wave",
    none: "",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-gray-200 ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-6 border border-gray-200">
    <Skeleton variant="circular" width={48} height={48} className="mb-4" />
    <Skeleton variant="text" width="70%" className="mb-2" />
    <Skeleton variant="text" width="90%" className="mb-2" />
    <Skeleton variant="text" width="60%" />
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({
  columns = 5,
}) => (
  <tr className="border-b border-gray-200">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <Skeleton variant="text" width="80%" />
      </td>
    ))}
  </tr>
);

export const AppCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={56} height={56} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" width="100%" className="mb-2" />
    <Skeleton variant="text" width="85%" className="mb-4" />
    <Skeleton variant="rectangular" height={44} width="100%" />
  </div>
);

export const BusinessUnitCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <Skeleton
      variant="rectangular"
      width={96}
      height={96}
      className="mb-4 mx-auto"
    />
    <Skeleton variant="text" width="80%" className="mb-2 mx-auto" />
    <Skeleton variant="text" width="60%" className="mb-4 mx-auto" />
    <Skeleton variant="rectangular" height={48} width="100%" />
  </div>
);

export default Skeleton;
