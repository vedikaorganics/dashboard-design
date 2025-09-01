'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MediaLibrary } from '@/components/cms/media-library/MediaLibrary'

export default function CMSMediaPage() {
  return (
    <DashboardLayout title="Media Library">
      <div className="h-[calc(100vh-6rem)]">
        <MediaLibrary 
          isOpen={true}
          onClose={() => {}}
          multiple={true}
          accept="all"
        />
      </div>
    </DashboardLayout>
  )
}