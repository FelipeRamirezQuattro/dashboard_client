import React, { useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  cn,
} from "@odessa-separator/ui";
import { MessageCircle, X } from "lucide-react";
import ChatbotWindow from "./ChatbotWindow";

interface ChatbotWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Below `sm` the chat panel covers the whole screen, so it behaves as a modal there
// (focus trapped, page inert, scroll locked). From `sm` up it is a non-modal side panel and
// the page next to it stays usable, as with the old drawer.
const PHONE_QUERY = "(max-width: 639.98px)";

const isPhoneViewport = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(PHONE_QUERY).matches;

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isOpen,
  onOpenChange,
}) => {
  // Fixed for as long as the panel is open: switching `modal` while open would remount the
  // content (Radix renders a different content component) and lose the conversation.
  const [modal, setModal] = useState(isPhoneViewport);
  const contentRef = useRef<HTMLDivElement>(null);
  // Whether focus was inside the panel when it was asked to close (read in onCloseAutoFocus,
  // when the panel is already being removed and document.activeElement is no longer reliable).
  const focusInsideOnCloseRef = useRef(true);

  const isFocusInsidePanel = () =>
    Boolean(contentRef.current?.contains(document.activeElement));

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setModal(isPhoneViewport());
    } else {
      focusInsideOnCloseRef.current = isFocusInsidePanel();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={modal}>
      {/* Floating launcher. z-40 is the value the old launcher used: above page content, below
          the library layers (dialogs, popovers, toasts are z-50), so toasts render over it. */}
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label="OSI Assistant"
          className="group fixed right-4 bottom-4 z-40 size-14 touch-manipulation transition-transform duration-200 hover:scale-110 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:size-16"
        >
          {isOpen ? (
            <X className="size-6 sm:size-7" aria-hidden="true" />
          ) : (
            <>
              <MessageCircle className="size-6 sm:size-7" aria-hidden="true" />
              {/* Pulse on hover (decorative) */}
              <span
                className="absolute inset-0 bg-action opacity-0 group-hover:opacity-75 motion-safe:group-hover:animate-ping"
                aria-hidden="true"
              />
            </>
          )}
        </Button>
      </DialogTrigger>

      {/* Chat panel: full-height side panel on the right (full screen on phones). */}
      <DialogContent
        closeLabel="Close chatbot"
        // The panel stays open while the user works on the page next to it; it closes with
        // the close buttons, the launcher or Escape.
        onInteractOutside={(event) => event.preventDefault()}
        ref={contentRef}
        // Non-modal: Radix listens for Escape on the whole document. Only close when the user
        // is in the panel, so Escape in a page field does not close the chat. (Radix only calls
        // this when the panel is the top layer; a page Dialog/Popover above it closes first.)
        onEscapeKeyDown={(event) => {
          if (!modal && !isFocusInsidePanel()) event.preventDefault();
        }}
        // Non-modal: if focus was on the page when the chat closed (e.g. the launcher), leave
        // it there instead of moving it to the launcher. From inside the panel (X, Close,
        // Escape) Radix still returns focus to the launcher.
        onCloseAutoFocus={(event) => {
          if (!modal && !focusInsideOnCloseRef.current) event.preventDefault();
          focusInsideOnCloseRef.current = true;
        }}
        className={cn(
          "top-0 right-0 bottom-0 left-auto flex h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden border-0 border-l p-0 sm:w-[560px]",
          // Non-modal side panel: one step below the library layers (z-50), like the desktop
          // Sidebar, so toasts, popovers and dialogs opened from the page stay on top of it.
          // The modal (phone) panel keeps the library z-50 so it sits above its own overlay.
          !modal && "z-40",
        )}
      >
        <ChatbotWindow onClose={() => handleOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotWidget;
