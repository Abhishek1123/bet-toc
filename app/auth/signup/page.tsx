'use client'

import { SignUpForm } from '@/components/SignUpForm'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return <SignUpForm />
}