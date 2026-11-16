import React from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@odessa-separator/ui";

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
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="primary">{actionLabel}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default NoticeModal;
