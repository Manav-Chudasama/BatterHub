"use client";

import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import ReviewForm from "./ReviewForm";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeRequestId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  existingReview?: {
    _id: string;
    rating: number;
    comment: string;
  };
}

export default function ReviewModal({
  isOpen,
  onClose,
  tradeRequestId,
  reviewedUserId,
  reviewedUserName,
  existingReview,
}: ReviewModalProps) {
  const [mounted, setMounted] = useState(false);

  // Handle modal mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Handle scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-black border border-black/[.08] dark:border-white/[.08] rounded-lg shadow-lg w-full max-w-md z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-black/[.08] dark:border-white/[.08]">
              <h3 className="text-lg font-medium">
                {existingReview ? "Edit Review" : "Leave a Review"}
              </h3>
              <button
                onClick={onClose}
                className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white rounded-full p-1"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <ReviewForm
                tradeRequestId={tradeRequestId}
                reviewedUserId={reviewedUserId}
                reviewedUserName={reviewedUserName}
                existingReview={existingReview}
                onSuccess={onClose}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
