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
import {
  Check,
  CircleCheckBig,
  Loader2,
  SaudiRiyal,
  SendHorizontal,
  X,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

const DRAG_CONSTRAINTS = { left: 0, right: 360 };
const DRAG_THRESHOLD = 0.9;

const BUTTON_STATES = {
  initial: { width: "25rem" },
  completed: { width: "22rem" },
};

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
};

const StatusIcon = ({ status }) => {
  const iconMap = useMemo(
    () => ({
      loading: <Loader2 className="animate-spin" size={20} />,
      success: <Check size={20} />,
      error: <X size={20} />,
    }),
    []
  );

  if (!iconMap[status]) return null;

  return (
    <motion.div
      key={crypto.randomUUID()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {iconMap[status]}
    </motion.div>
  );
};

const SlideButton = forwardRef(
  ({ className, price, handlePayment, isProcessing, ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [completed, setCompleted] = useState(false);
    const dragHandleRef = useRef(null);

    const dragX = useMotionValue(0);
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring);
    const dragProgress = useTransform(
      springX,
      [0, DRAG_CONSTRAINTS.right],
      [0, 1]
    );

    // Animate the background color to fill as the user drags
    const backgroundColor = useTransform(
      dragProgress,
      [0, 1],
      ["rgba(10, 76, 135, 0.8)", "rgba(76, 158, 217, 0.8)"]
    );

    // Animate the text color to transition from black to white as the user drags
    const placeholderTextColor = useTransform(
      dragProgress,
      [0, 1],
      ["#000", "#fff"]
    );

    const handleDragStart = useCallback(() => {
      if (completed) return;
      setIsDragging(true);
    }, [completed]);

    const handleDragEnd = () => {
      if (completed) return;
      setIsDragging(false);

      const progress = dragProgress.get();
      if (progress >= DRAG_THRESHOLD) {
        setCompleted(true);
        handlePayment(); // Automatically trigger handlePayment when completed
      } else {
        dragX.set(0);
      }
    };

    const handleDrag = (_event, info) => {
      if (completed) return;
      const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right));
      dragX.set(newX);
    };

    const adjustedWidth = useTransform(springX, (x) => x + 10);

    // Decide the button title and icon based on the isProcessing prop
    const buttonTitle = useMemo(() => {
      if (isProcessing) return "Processing..."; // Show "Processing..." when isProcessing is true
      if (completed)
        return (
          <span>
            Transaction <SaudiRiyal />
          </span>
        ); // Show "Transaction ✔️" once drag is completed
      return `Make Payment (${price})`; // Default title with price
    }, [isProcessing, completed, price]);

    const buttonIcon = useMemo(() => {
      if (isProcessing)
        return <Loader2 className="animate-spin mr-2" size={20} />;
      if (completed) return <Check className="mr-2" size={20} />;
      return <SaudiRiyal className="size-4 mr-2" />;
    }, [isProcessing, completed]);

    return (
      <motion.div
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className="shadow-button-inset dark:shadow-button-inset-dark relative flex h-9 items-center justify-center rounded-md bg-gray-100"
      >
        {/* Background that fills with the drag */}
        {!completed && (
          <motion.div
            style={{
              width: adjustedWidth,
              backgroundColor,
            }}
            className="absolute inset-y-0 left-0 z-0 rounded-md"
          />
        )}

        <AnimatePresence key={crypto.randomUUID()}>
          {!completed && (
            <motion.div
              ref={dragHandleRef}
              drag="x"
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute -left-4 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                disabled={isProcessing}
                {...props}
                size="icon"
                className={cn(
                  "shadow-button rounded-md drop-shadow-xl",
                  isDragging && "scale-105 transition-transform",
                  className
                )}
              >
                {buttonIcon}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence key={crypto.randomUUID()}>
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                ref={ref}
                disabled={isProcessing}
                {...props}
                className={cn(
                  "size-full rounded-md transition-all duration-300",
                  className
                )}
              >
                <AnimatePresence key={crypto.randomUUID()} mode="wait">
                  <StatusIcon status={status} />
                  <span className="ml-2 font-medium flex items-center gap-2">
                    Transaction <CircleCheckBig />
                  </span>
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!completed && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Display the placeholder text in black before drag, and change to white as user drags */}
            <motion.span
              style={{ color: placeholderTextColor }}
              className="font-medium"
            >
              {buttonTitle}
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    );
  }
);

SlideButton.displayName = "SlideButton";

export default SlideButton;
