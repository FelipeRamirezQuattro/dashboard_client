import React from "react";
import { Banner } from "@odessa-separator/ui";

export type StatusBannerVariant = "success" | "error" | "warning" | "info";

interface StatusBannerProps {
  variant: StatusBannerVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
}

const bannerVariant = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "info",
} as const;

const StatusBanner: React.FC<StatusBannerProps> = ({
  variant,
  title,
  message,
  onDismiss,
}) => (
  <Banner
    variant={bannerVariant[variant]}
    onDismiss={onDismiss}
    dismissLabel="Dismiss message"
  >
    <div className="min-w-0">
      {title && <p className="font-semibold">{title}</p>}
      <p>{message}</p>
    </div>
  </Banner>
);

export default StatusBanner;
