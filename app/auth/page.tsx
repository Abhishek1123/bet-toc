'use client'

import { AuthForm } from '@/components/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export default function AuthPage() {
  const { user } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user) {
      window.location.href = '/'
    }
  }, [user])

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return <AuthForm />
}
