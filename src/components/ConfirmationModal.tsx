import React from "react";
import { ConfirmDialog } from "@odessa-separator/ui";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isPending = false,
  onConfirm,
  onCancel,
}) => {
  // ConfirmDialog closes itself (onOpenChange(false)) when the confirm button is
  // clicked. Callers own the open state and keep the dialog open while the action
  // runs, so that close request must not reach onCancel.
  const confirmedRef = React.useRef(false);

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(next) => {
        if (next) return;
        if (confirmedRef.current) {
          confirmedRef.current = false;
          return;
        }
        onCancel();
      }}
      title={title}
      description={message}
      confirmLabel={isPending ? "Working..." : confirmLabel}
      cancelLabel={cancelLabel}
      destructive={tone === "danger"}
      busy={isPending}
      onConfirm={() => {
        confirmedRef.current = true;
        onConfirm();
      }}
    />
  );
};

export default ConfirmationModal;
