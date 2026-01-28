import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 32, text = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <Loader2 size={size} className="animate-spin" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}