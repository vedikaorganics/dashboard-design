'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, Clock, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContentStatus } from '@/types/cms'

interface PublishControlsProps {
  status: ContentStatus
  publishedAt?: Date
  scheduledPublishAt?: Date
  onPublish: (publishAt?: Date) => Promise<void>
  onUnpublish: () => Promise<void>
  disabled?: boolean
}

export function PublishControls({
  status,
  publishedAt,
  scheduledPublishAt,
  onPublish,
  onUnpublish,
  disabled = false
}: PublishControlsProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePublishNow = async () => {
    setIsLoading(true)
    try {
      await onPublish()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchedulePublish = async () => {
    if (!scheduleDate || !scheduleTime) return

    const publishAt = new Date(`${scheduleDate}T${scheduleTime}`)
    
    setIsLoading(true)
    try {
      await onPublish(publishAt)
      setShowScheduleDialog(false)
      setScheduleDate('')
      setScheduleTime('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this content?')) return

    setIsLoading(true)
    try {
      await onUnpublish()
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonContent = () => {
    if (status === 'published') {
      return {
        text: 'Published',
        icon: <CheckCircle className="w-4 h-4 mr-2" />,
        variant: 'default' as const
      }
    } else if (scheduledPublishAt) {
      return {
        text: 'Scheduled',
        icon: <Clock className="w-4 h-4 mr-2" />,
        variant: 'secondary' as const
      }
    } else {
      return {
        text: 'Publish',
        icon: null,
        variant: 'default' as const
      }
    }
  }

  const buttonContent = getButtonContent()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={buttonContent.variant}
            disabled={disabled || isLoading}
            className="min-w-24"
          >
            {buttonContent.icon}
            {buttonContent.text}
            <MoreHorizontal className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {status !== 'published' && (
            <DropdownMenuItem onClick={handlePublishNow} disabled={disabled}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish now
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowScheduleDialog(true)}
            disabled={disabled}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule publish
          </DropdownMenuItem>

          {(status === 'published' || scheduledPublishAt) && (
            <DropdownMenuItem 
              onClick={handleUnpublish}
              disabled={disabled}
              className="text-destructive"
            >
              Unpublish
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Schedule dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Publication</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            {scheduleDate && scheduleTime && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Will be published on{' '}
                  <span className="font-medium">
                    {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleDialog(false)
                  setScheduleDate('')
                  setScheduleTime('')
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedulePublish}
                disabled={!scheduleDate || !scheduleTime || isLoading}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isLoading ? 'Scheduling...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}