import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type StatusBannerVariant = "success" | "error" | "warning" | "info";

interface StatusBannerProps {
  variant: StatusBannerVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
}

const variantStyles: Record<
  StatusBannerVariant,
  {
    bg: string;
    border: string;
    text: string;
    title: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    title: "text-emerald-900",
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    title: "text-red-900",
    icon: <AlertCircle size={18} aria-hidden="true" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    title: "text-amber-900",
    icon: <AlertCircle size={18} aria-hidden="true" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    title: "text-blue-900",
    icon: <Info size={18} aria-hidden="true" />,
  },
};

const StatusBanner: React.FC<StatusBannerProps> = ({
  variant,
  title,
  message,
  onDismiss,
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-lg border ${styles.border} ${styles.bg} px-4 py-3`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${styles.text}`}>{styles.icon}</div>
        <div className="min-w-0 flex-1">
          {title && (
            <p className={`text-sm font-semibold leading-5 ${styles.title}`}>
              {title}
            </p>
          )}
          <p className={`text-sm leading-5 ${styles.text}`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`rounded-md p-1 transition-colors hover:bg-white/70 ${styles.text}`}
            aria-label="Dismiss message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusBanner;
