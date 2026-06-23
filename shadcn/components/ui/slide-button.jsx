import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Check, ChevronsRight, Loader2, RotateCcw, X } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

const TRACK_WIDTH = 360; // px, drag distance == handle travel
const DRAG_CONSTRAINTS = { left: 0, right: TRACK_WIDTH };
const DRAG_THRESHOLD = 0.9;

const ANIMATION_CONFIG = {
  spring: { type: "spring", stiffness: 400, damping: 40, mass: 0.8 },
};

// mode -> accent colors, matching DepositTabComponent (vendor=blue, customer=violet)
const THEME = {
  vendor: {
    trackFrom: "rgba(37, 99, 235, 0.85)", // blue-600
    trackTo: "rgba(99, 102, 241, 0.85)", // indigo-500
    solid: "bg-blue-600 hover:bg-blue-700",
  },
  customer: {
    trackFrom: "rgba(124, 58, 237, 0.85)", // violet-600
    trackTo: "rgba(168, 85, 247, 0.85)", // purple-500
    solid: "bg-violet-600 hover:bg-violet-700",
  },
};

const fmt = (n) =>
  `QAR ${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const StatusIcon = ({ status }) => {
  const iconMap = {
    loading: <Loader2 className="animate-spin" size={20} />,
    success: <Check size={20} />,
    error: <X size={20} />,
  };
  if (!iconMap[status]) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    >
      {iconMap[status]}
    </motion.div>
  );
};

const SlideButton = forwardRef(
  (
    {
      className,
      price,
      handlePayment,
      isProcessing: isProcessingProp,
      disabled,
      mode = "vendor",
      label,
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    // "idle" | "loading" | "success" | "error"
    const [status, setStatus] = useState("idle");
    const dragHandleRef = useRef(null);

    const dragX = useMotionValue(0);
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring);
    const dragProgress = useTransform(springX, [0, TRACK_WIDTH], [0, 1]);

    const theme = THEME[mode] ?? THEME.vendor;

    const trackColor = useTransform(
      dragProgress,
      [0, 1],
      [theme.trackFrom, theme.trackTo],
    );
    const placeholderTextColor = useTransform(
      dragProgress,
      [0, 1],
      ["#1e293b", "#fff"], // slate-800 -> white, matches the app's text tone
    );

    const settled = status === "success" || status === "error";
    const isLocked = isProcessingProp || disabled || status === "loading";

    const resetDrag = () => dragX.set(0);

    const retry = () => {
      setStatus("idle");
      resetDrag();
    };

    const handleDragStart = useCallback(() => {
      if (settled || isLocked) return;
      setIsDragging(true);
    }, [settled, isLocked]);

    const handleDrag = useCallback(
      (_event, info) => {
        if (settled || isLocked) return;
        const newX = Math.max(0, Math.min(info.offset.x, TRACK_WIDTH));
        dragX.set(newX);
      },
      [settled, isLocked, dragX],
    );

    const handleDragEnd = useCallback(async () => {
      if (settled || isLocked) return;
      setIsDragging(false);

      const progress = dragProgress.get();
      if (progress < DRAG_THRESHOLD) {
        resetDrag();
        return;
      }

      setStatus("loading");
      try {
        // Supports either a Promise-returning handlePayment (preferred) or a
        // fire-and-forget callback. If it returns a Promise, we wait for it
        // and reflect failure as an error state the user can retry.
        await handlePayment?.();
        setStatus("success");
      } catch (err) {
        setStatus("error");
      }
    }, [settled, isLocked, dragProgress, handlePayment]);

    const adjustedWidth = useTransform(springX, (x) => x + 48);

    const title = useMemo(() => {
      if (status === "loading") return "Processing...";
      if (status === "success") return label ?? "Payment recorded";
      if (status === "error") return "Payment failed — tap to retry";
      return `Slide to pay ${fmt(price)}`;
    }, [status, label, price]);

    return (
      <div className="w-full">
        <motion.div
          className={cn(
            "relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 shadow-inner",
            isLocked && status === "idle" && "opacity-60",
          )}
        >
          {/* Fill that grows with drag progress */}
          {status === "idle" && (
            <motion.div
              style={{ width: adjustedWidth, background: trackColor }}
              className="absolute inset-y-0 left-0 z-0 rounded-xl"
            />
          )}

          {/* Idle: draggable handle */}
          <AnimatePresence>
            {status === "idle" && (
              <motion.div
                ref={dragHandleRef}
                drag={isLocked ? false : "x"}
                dragConstraints={DRAG_CONSTRAINTS}
                dragElastic={0.05}
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                style={{ x: springX }}
                className={cn(
                  "absolute left-1 z-10 flex items-center justify-center",
                  isLocked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
                )}
              >
                <Button
                  ref={ref}
                  type="button"
                  disabled={isLocked}
                  {...props}
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-lg shadow-md transition-transform",
                    theme.solid,
                    isDragging && "scale-105",
                    className,
                  )}
                >
                  <ChevronsRight size={18} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading / Success / Error overlay */}
          <AnimatePresence mode="wait">
            {status !== "idle" && (
              <motion.div
                key={status}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-2 rounded-xl font-medium text-white",
                  status === "loading" && theme.solid,
                  status === "success" && "bg-green-600",
                  status === "error" && "bg-red-600",
                )}
              >
                <StatusIcon status={status} />
                <span>{title}</span>
                {status === "error" && (
                  <button
                    type="button"
                    onClick={retry}
                    className="ml-1 flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25 transition-colors"
                  >
                    <RotateCcw size={12} /> Retry
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle placeholder text */}
          {status === "idle" && (
            <motion.span
              style={{ color: placeholderTextColor }}
              className="pointer-events-none relative z-[1] select-none text-sm font-medium"
            >
              {title}
            </motion.span>
          )}
        </motion.div>
      </div>
    );
  },
);

SlideButton.displayName = "SlideButton";

export default SlideButton;