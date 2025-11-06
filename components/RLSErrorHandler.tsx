'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface RLSErrorHandlerProps {
  error: string
  onRetry?: () => void
}

export function RLSErrorHandler({ error, onRetry }: RLSErrorHandlerProps) {
  const { user } = useAuth()
  const [fixing, setFixing] = useState(false)
  const [fixed, setFixed] = useState(false)

  const isRLSError = error.includes('row-level security policy') || 
                    error.includes('violates foreign key constraint') ||
                    error.includes('permission denied')

  if (!isRLSError) {
    return null
  }

  const handleFixProfile = async () => {
    if (!user || !supabase) return
    
    setFixing(true)
    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (!profile) {
        // Create profile
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })
        
        if (insertError) {
          throw new Error(insertError.message)
        }
      }
      
      setFixed(true)
      onRetry?.()
    } catch (err: any) {
      console.error('Failed to fix profile:', err.message)
      alert('Failed to fix profile: ' + err.message)
    } finally {
      setFixing(false)
    }
  }

  if (fixed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-800">
            <UserPlus className="h-5 w-5" />
            <span className="font-medium">Profile fixed! Try uploading your video again.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <span>Profile Setup Required</span>
        </CardTitle>
        <CardDescription className="text-amber-700">
          We need to set up your user profile to enable video uploads. This is a one-time setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-amber-700">
          <p>Your account appears to be missing a user profile, which is required for uploading videos.</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={handleFixProfile}
            disabled={fixing}
            className="flex-1"
          >
            {fixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Setting up profile...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Fix Profile
              </>
            )}
          </Button>
          
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              disabled={fixing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
