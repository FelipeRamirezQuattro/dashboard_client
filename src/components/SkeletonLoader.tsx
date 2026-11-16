import React from "react";
import {
  Card,
  CardContent,
  Skeleton as UiSkeleton,
  cn,
} from "@odessa-separator/ui";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

const toCss = (value: string | number | undefined) =>
  typeof value === "number" ? `${value}px` : value;

// `animation` and the circular shape are kept for caller compatibility only: the
// library Skeleton owns its animation and corner radius (see library-gaps.md).
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
}) => (
  <UiSkeleton
    className={cn(
      variant === "text" && "h-4",
      className,
    )}
    style={{ width: toCss(width), height: toCss(height) }}
  />
);

export const CardSkeleton: React.FC = () => (
  <Card aria-busy="true">
    <CardContent className="p-6">
      <Skeleton variant="circular" width={48} height={48} className="mb-4" />
      <Skeleton variant="text" width="70%" className="mb-2" />
      <Skeleton variant="text" width="90%" className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </CardContent>
  </Card>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({
  columns = 5,
}) => (
  <tr className="border-b border-border">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <Skeleton variant="text" width="80%" />
      </td>
    ))}
  </tr>
);

export const AppCardSkeleton: React.FC = () => (
  <Card aria-busy="true">
    <CardContent className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-4">
        <Skeleton variant="circular" width={56} height={56} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="text" width="100%" className="mb-2" />
      <Skeleton variant="text" width="85%" className="mb-4" />
      <Skeleton variant="rectangular" height={44} width="100%" />
    </CardContent>
  </Card>
);

export const BusinessUnitCardSkeleton: React.FC = () => (
  <Card aria-busy="true">
    <CardContent className="p-6">
      <Skeleton
        variant="rectangular"
        width={96}
        height={96}
        className="mx-auto mb-4"
      />
      <Skeleton variant="text" width="80%" className="mx-auto mb-2" />
      <Skeleton variant="text" width="60%" className="mx-auto mb-4" />
      <Skeleton variant="rectangular" height={48} width="100%" />
    </CardContent>
  </Card>
);

export default Skeleton;
