'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  // Fetch user bio from database
  const [isLoadingBio, setIsLoadingBio] = useState(true)
  
  useState(() => {
    if (open && user) {
      fetchUserBio()
    }
  })

  const fetchUserBio = async () => {
    if (!supabase || !user) return
    try {
      const { data, error } = await supabase
        .from('users')
        .select('bio')
        .eq('id', user.id)
        .single()
      
      if (data?.bio) {
        setBio(data.bio)
      }
    } catch (error) {
      console.error('Error fetching bio:', error)
    } finally {
      setIsLoadingBio(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user || !supabase) throw new Error('Not authenticated')

      let avatarUrl = user.user_metadata?.avatar_url || ''

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-avatar.${fileExt}`
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })
        
        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        avatarUrl = data.publicUrl
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl
        }
      })

      if (updateError) throw updateError

      // Update bio in database
      const { error: dbError } = await supabase
        .from('users')
        .update({ bio })
        .eq('id', user.id)

      if (dbError) throw dbError

      return true
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      onOpenChange(false)
      setAvatarFile(null)
      setPreviewUrl('')
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + (error as Error).message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-3">
            <Label className="text-gray-300">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm">
                  Change Photo
                </div>
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-300">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-gray-300">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-400">{bio.length}/150</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
