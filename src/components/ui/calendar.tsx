
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DateRange } from "react-day-picker"
import { addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  withQuickActions?: boolean;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  withQuickActions = false,
  ...props
}: CalendarProps) {

  const handleSelect = (range: DateRange | undefined) => {
    if (props.onSelect && typeof props.onSelect === 'function') {
      props.onSelect(range as any, new Date(), {} as any);
    }
  };

  const quickActions = [
    { label: "Today", action: () => handleSelect({ from: new Date(), to: new Date() })},
    { label: "Yesterday", action: () => handleSelect({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })},
    { label: "This Week", action: () => handleSelect({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })},
    { label: "Last 7 Days", action: () => handleSelect({ from: subDays(new Date(), 6), to: new Date() })},
    { label: "This Month", action: () => handleSelect({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })},
    { label: "Last Month", action: () => handleSelect({ from: startOfMonth(subDays(new Date(), 30)), to: endOfMonth(subDays(new Date(), 30)) })},
  ]

  return (
    <div className={cn("flex flex-col sm:flex-row", { "gap-4": withQuickActions })}>
      {withQuickActions && (
        <div className="flex flex-col gap-2 border-r pr-4">
          {quickActions.map(({label, action}) => (
            <Button key={label} variant="ghost" className="justify-start" onClick={action}>
              {label}
            </Button>
          ))}
        </div>
      )}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...props }) => (
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ),
          IconRight: ({ className, ...props }) => (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
