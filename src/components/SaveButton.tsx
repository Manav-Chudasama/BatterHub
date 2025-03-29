import { useState } from "react";
import { RiBookmarkLine, RiBookmarkFill, RiLoader4Line } from "react-icons/ri";
import { useUser } from "@clerk/nextjs";

interface SaveButtonProps {
  listingId: string;
  initialSaved: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onSaveChange?: (saved: boolean) => void;
}

export default function SaveButton({
  listingId,
  initialSaved,
  showText = true,
  size = "md",
  className = "",
  onSaveChange,
}: SaveButtonProps) {
  const { user, isLoaded } = useUser();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-xs rounded",
    md: "px-3 py-1.5 text-sm rounded-lg",
    lg: "px-4 py-2 text-base rounded-lg",
  };

  // Icon sizes
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    // Prevent event bubbling if inside a link or other clickable element
    e.stopPropagation();
    e.preventDefault();

    if (!user || !isLoaded) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/listings/${listingId}/save`, {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            (isSaved ? "Failed to unsave listing" : "Failed to save listing")
        );
      }

      // Update local state
      setIsSaved(!isSaved);

      // Call callback if provided
      if (onSaveChange) {
        onSaveChange(!isSaved);
      }
    } catch (err) {
      console.error("Error toggling save status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update saved status"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <button
      onClick={handleSaveToggle}
      disabled={isSaving}
      className={`flex items-center gap-1 ${sizeClasses[size]} ${
        isSaved
          ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          : "bg-black/[.05] hover:bg-black/[.08] dark:bg-white/[.05] dark:hover:bg-white/[.08]"
      } ${className}`}
      title={isSaved ? "Remove from saved listings" : "Save to your listings"}
    >
      {isSaving ? (
        <RiLoader4Line className={iconSizes[size] + " animate-spin"} />
      ) : isSaved ? (
        <RiBookmarkFill className={iconSizes[size]} />
      ) : (
        <RiBookmarkLine className={iconSizes[size]} />
      )}
      {showText && (isSaved ? "Saved" : "Save")}

      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}
