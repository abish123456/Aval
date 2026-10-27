'use client'
import { useState, useEffect } from 'react'

interface AnnouncementBarProps {
  message: string
}

export default function AnnouncementBar({ message }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="announcement-bar" role="banner">
      <p style={{ margin: 0, fontSize: '13px' }}>{message}</p>
      <button
        onClick={() => setVisible(false)}
        aria-label="Close announcement"
        style={{
          position: 'absolute',
          right: '16px',
          background: 'none',
          border: 'none',
          color: '#FBF7F3',
          fontSize: '16px',
          cursor: 'pointer',
          opacity: 0.7,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
