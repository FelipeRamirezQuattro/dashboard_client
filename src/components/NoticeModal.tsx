import React from "react";

interface NoticeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  title,
  message,
  actionLabel = "Got it",
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
        aria-label="Close message"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 id="notice-modal-title" className="text-lg font-bold text-gray-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">
              lock
            </span>
          </div>
          <p className="text-sm leading-6 text-gray-500">{message}</p>
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-osi-primary px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-osi-primary-dark"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;
