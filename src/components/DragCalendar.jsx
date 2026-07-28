import { useState, useMemo, useEffect } from "react";
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

export default function RangeCalendar({
  selected,
  onSelect,
  defaultMonth,
  numberOfMonths = 2,
}) {
  const [baseMonth, setBaseMonth] = useState(defaultMonth || new Date());
  const [anchor, setAnchor] = useState(null); // day clicked first, awaiting the 2nd click
  const [hoverDay, setHoverDay] = useState(null);

  // If the selection changes from outside (e.g. a preset button, or the
  // popover was reopened), cancel any selection currently in progress.
  useEffect(() => {
    setAnchor(null);
    setHoverDay(null);
  }, [selected?.from, selected?.to]);

  const handleDayClick = (day) => () => {
    if (!anchor) {
      // First click: this day is the new start. Don't touch the parent's
      // state yet — wait for the 2nd click so a mid-range single click
      // can't be mistaken for a committed 1-day range.
      setAnchor(day);
      setHoverDay(day);
      return;
    }
    // Second click: commit the range, sorted so `from` is always earliest.
    const from = isBefore(day, anchor) ? day : anchor;
    const to = isBefore(day, anchor) ? anchor : day;
    onSelect({ from, to });
    setAnchor(null);
    setHoverDay(null);
  };

  const handleDayMouseEnter = (day) => () => {
    if (anchor) setHoverDay(day);
  };

  // What to actually draw: the live in-progress preview while picking the
  // 2nd date, otherwise whatever the parent currently has selected.
  const displayRange = anchor
    ? {
        from: isBefore(hoverDay || anchor, anchor) ? hoverDay || anchor : anchor,
        to: isBefore(hoverDay || anchor, anchor) ? anchor : hoverDay || anchor,
      }
    : selected;

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
            range={displayRange}
            anchor={anchor}
            onDayClick={handleDayClick}
            onDayMouseEnter={handleDayMouseEnter}
          />
        ))}
      </div>

      {anchor && (
        <div className="px-1 pt-2 text-xs text-muted-foreground">
          Pick the end date — start is {format(anchor, "LLL d, y")}
        </div>
      )}
    </div>
  );
}

function MonthGrid({ monthDate, range, anchor, onDayClick, onDayMouseEnter }) {
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
          const from = range?.from;
          const to = range?.to;

          const isStart = from && isSameDay(day, from);
          const isEnd = to && isSameDay(day, to);
          const isRangeSpan = from && to && !isSameDay(from, to);
          const inRange = isRangeSpan && isWithinInterval(day, { start: from, end: to });
          const isToday = isSameDay(day, today);
          const isAnchor = anchor && isSameDay(day, anchor);

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
                onClick={onDayClick(day)}
                onMouseEnter={onDayMouseEnter(day)}
                className={[
                  "h-9 w-9 text-sm rounded-md flex items-center justify-center transition-colors",
                  !inMonth ? "text-muted-foreground opacity-40" : "",
                  isStart || isEnd
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                  isAnchor ? "ring-2 ring-primary ring-offset-1" : "",
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