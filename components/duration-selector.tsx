"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DurationOption {
  duration: number
  label: string
  available: boolean
}

interface DurationSelectorProps {
  isOpen: boolean
  onClose: () => void
  startTime: Date
  availableDurations: DurationOption[]
  onDurationSelect: (duration: number) => void
}

export function DurationSelector({
  isOpen,
  onClose,
  startTime,
  availableDurations,
  onDurationSelect
}: DurationSelectorProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getEndTime = (duration: number) => {
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + duration)
    return endTime
  }

  const handleConfirm = () => {
    if (selectedDuration) {
      onDurationSelect(selectedDuration)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Select Meeting Duration</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Starting at {formatTime(startTime)}</h3>
            <p className="text-sm text-muted-foreground">
              Choose how long you need the room
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {availableDurations.map(({ duration, label, available }) => (
              <Button
                key={duration}
                variant={selectedDuration === duration ? "default" : "outline"}
                className={`h-20 p-4 text-left justify-between ${
                  !available ? "opacity-50 cursor-not-allowed" : ""
                } ${selectedDuration === duration ? "ring-2 ring-primary" : ""}`}
                disabled={!available}
                onClick={() => setSelectedDuration(duration)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-base">{label}</span>
                  <span className="text-sm text-muted-foreground">
                    Until {formatTime(getEndTime(duration))}
                  </span>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {selectedDuration === duration && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                  {!available && (
                    <Badge variant="secondary" className="text-xs">
                      Conflicts
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {selectedDuration && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-800">Selected Duration</h4>
                  <p className="text-sm text-green-600">
                    {formatTime(startTime)} - {formatTime(getEndTime(selectedDuration))}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {availableDurations.find(d => d.duration === selectedDuration)?.label}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedDuration}
              className="min-w-[120px]"
            >
              Confirm Duration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}