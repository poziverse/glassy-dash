/**
 * AsyncWrapper Component
 * Provides Suspense boundaries for async components with loading states
 * Part of Phase 2: Enhanced Error Handling Architecture
 */

import { Suspense } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function AsyncWrapper({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  )
}