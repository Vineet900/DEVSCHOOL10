import React from 'react'

export const Skeleton = ({ className }) => (
  <div className={`animate-shimmer bg-white/5 rounded-xl ${className}`} />
)

export const CardSkeleton = () => (
  <div className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.02] space-y-4">
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  </div>
)

export const ProfileSkeleton = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-6">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  </div>
)
