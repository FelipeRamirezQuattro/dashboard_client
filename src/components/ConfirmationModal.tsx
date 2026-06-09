import React from "react";

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
  if (!isOpen) return null;

  const icon = tone === "danger" ? "delete" : "warning";
  const iconClass =
    tone === "danger" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700";
  const buttonClass =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-osi-primary text-gray-900 hover:bg-osi-primary-dark";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onCancel}
        aria-label="Close confirmation"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <div
            className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">
              {icon}
            </span>
          </div>
          <h3
            id="confirmation-modal-title"
            className="text-lg font-bold text-gray-900"
          >
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
        </div>
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
          >
            {isPending ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
