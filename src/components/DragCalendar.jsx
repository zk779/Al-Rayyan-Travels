import { useState, useCallback, useMemo, useEffect } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  isBefore,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

function buildMonthGrid(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  return eachDayOfInterval({ start, end });
}

/**
 * Drop-in replacement for shadcn/react-day-picker's <Calendar mode="range" />
 * that supports selecting a range by dragging from one date to another
 * (mousedown -> mouseenter across days -> mouseup), instead of requiring
 * two separate clicks.
 *
 * Props mirror the ones already used in SalesReport.jsx:
 *   selected: { from: Date, to: Date }
 *   onSelect: (range) => void
 *   defaultMonth: Date        // which month to open on
 *   numberOfMonths: number    // how many months to show side by side
 */
export default function DragRangeCalendar({
  selected,
  onSelect,
  defaultMonth,
  numberOfMonths = 2,
}) {
  const [baseMonth, setBaseMonth] = useState(defaultMonth || new Date());
  const [dragging, setDragging] = useState(false);
  const [anchor, setAnchor] = useState(null);
  // Local "in progress" range shown while dragging, before it's committed
  // via onSelect on mouseup.
  const [previewRange, setPreviewRange] = useState(selected || null);

  // Stay in sync with external changes (e.g. a preset button) as long as
  // we're not in the middle of a drag.
  useEffect(() => {
    if (!dragging) setPreviewRange(selected || null);
  }, [selected, dragging]);

  const endDragging = useCallback(() => {
    setDragging((wasDragging) => {
      if (wasDragging) {
        setPreviewRange((range) => {
          if (range?.from) onSelect(range);
          return range;
        });
      }
      return false;
    });
    setAnchor(null);
  }, [onSelect]);

  // Commit the drag even if the mouse is released outside a day cell
  // (or outside the calendar entirely).
  useEffect(() => {
    if (!dragging) return undefined;
    window.addEventListener("mouseup", endDragging);
    return () => window.removeEventListener("mouseup", endDragging);
  }, [dragging, endDragging]);

  const handleDayMouseDown = (day) => (e) => {
    e.preventDefault();
    setDragging(true);
    setAnchor(day);
    setPreviewRange({ from: day, to: day });
  };

  const handleDayMouseEnter = (day) => () => {
    if (!dragging || !anchor) return;
    setPreviewRange(
      isBefore(day, anchor) ? { from: day, to: anchor } : { from: anchor, to: day },
    );
  };

  const months = useMemo(
    () => Array.from({ length: numberOfMonths }, (_, i) => addMonths(baseMonth, i)),
    [baseMonth, numberOfMonths],
  );

  return (
    <div className="select-none p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setBaseMonth((m) => subMonths(m, 1))}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setBaseMonth((m) => addMonths(m, 1))}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-6">
        {months.map((monthDate) => (
          <MonthGrid
            key={monthDate.toISOString()}
            monthDate={monthDate}
            range={previewRange}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
          />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ monthDate, range, onDayMouseDown, onDayMouseEnter }) {
  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const today = new Date();

  return (
    <div className="w-[252px]">
      <div className="text-center text-sm font-medium mb-2">
        {format(monthDate, "MMMM yyyy")}
      </div>
      <div className="grid grid-cols-7 text-center text-[0.8rem] text-muted-foreground mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="h-8 flex items-center justify-center font-normal">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthDate);
          const from = range?.from && range?.to
            ? (isBefore(range.from, range.to) ? range.from : range.to)
            : range?.from;
          const to = range?.from && range?.to
            ? (isBefore(range.from, range.to) ? range.to : range.from)
            : range?.to;

          const isStart = from && isSameDay(day, from);
          const isEnd = to && isSameDay(day, to);
          const isRangeSpan = from && to && !isSameDay(from, to);
          const inRange = isRangeSpan && isWithinInterval(day, { start: from, end: to });
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={[
                "h-9 flex items-center justify-center",
                inRange ? "bg-accent" : "",
                isStart && isRangeSpan ? "rounded-l-md bg-accent" : "",
                isEnd && isRangeSpan ? "rounded-r-md bg-accent" : "",
              ].join(" ")}
            >
              <button
                type="button"
                onMouseDown={onDayMouseDown(day)}
                onMouseEnter={onDayMouseEnter(day)}
                className={[
                  "h-9 w-9 text-sm rounded-md flex items-center justify-center transition-colors",
                  !inMonth ? "text-muted-foreground opacity-40" : "",
                  isStart || isEnd
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                  isToday && !isStart && !isEnd ? "border border-primary" : "",
                ].join(" ")}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}