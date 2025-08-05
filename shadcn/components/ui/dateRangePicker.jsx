"use client";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../../lib/utils"; // Utility for classnames (optional)
import { Calendar } from "./calendar"; // Assuming you have a custom Calendar component
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import DateRange from "react-day-picker";

// DateRangePicker component
export default function DateRangePicker({
  className,
  onChange, // Prop to handle date range change
}) {
  const [date, setDate] =
    (React.useState < DateRange) |
    (undefined >
      {
        from: addDays(new Date(), -20), // Default starting date (20 days ago)
        to: new Date(), // Default end date (today)
      });

  // Callback to update the date range and notify the parent component
  const handleDateSelect = (range) => {
    setDate(range);
    onChange(range); // Pass the updated date range to the parent
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect} // Update the date when a range is selected
            numberOfMonths={2} // Show two months at once
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
