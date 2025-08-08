import { CalendarDays, Clock } from "lucide-react";
import React, { useState, useEffect } from "react";

function LiveDateTime() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
      setDate(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex-col items-end contents ">
      <div className="flex items-end gap-2">
        <CalendarDays className="text-slate-700" />
        <div className="text-lg font-medium text-gray-700">{date}</div>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="text-slate-700" />
        <div className="text-3xl font-bold text-slate-600">{time}</div>
      </div>
    </div>
  );
}

export default LiveDateTime;
