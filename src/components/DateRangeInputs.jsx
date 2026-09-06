"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ArrowRight } from "lucide-react";

import { Button } from "../../shadcn/components/ui/button";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";

function DateField({ label, date, onSelect, disabledMatcher, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex-1 min-w-0 space-y-1">
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full min-w-0 justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              {date ? format(date, "dd MMM yyyy") : "Select"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            disabled={disabledMatcher}
            onSelect={(d) => {
              if (!d) return;
              onSelect(d);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Two explicit Start/End date pickers instead of a single range calendar —
// each date is constrained so the range can never end up inverted.
export default function DateRangeInputs({ from, to, onChange, disabled }) {
  const handleFrom = (date) => onChange({ from: date, to: to && date > to ? date : to });
  const handleTo = (date) => onChange({ from: from && date < from ? date : from, to: date });

  return (
    <div className="flex items-end gap-2">
      <DateField
        label="Start date"
        date={from}
        onSelect={handleFrom}
        disabledMatcher={to ? { after: to } : undefined}
        disabled={disabled}
      />
      <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mb-2.5" />
      <DateField
        label="End date"
        date={to}
        onSelect={handleTo}
        disabledMatcher={from ? { before: from } : undefined}
        disabled={disabled}
      />
    </div>
  );
}
