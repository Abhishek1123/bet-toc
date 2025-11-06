'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Video, FileVideo } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface VideoUploadProps {
  onClose: () => void
}

export function VideoUpload({ onClose }: VideoUploadProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(uploadedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !file || !supabase) throw new Error('Missing required data')
      
      setUploading(true)
      setUploadProgress(0)
      
      // Ensure user profile exists before upload
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })
        
        if (insertError) throw new Error(`Failed to create user profile: ${insertError.message || insertError.toString()}`)
      } else if (profileError) {
        throw new Error(`Failed to check user profile: ${profileError.message || profileError.toString()}`)
      }
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `videos/${user.id}/${fileName}`
      
      // Upload video to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      setUploadProgress(95)
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)
      
      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title || null,
          description: description || null,
          video_url: publicUrl,
          duration: null, // TODO: Extract from video metadata
        })
      
      if (dbError) throw dbError
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      return publicUrl
    },
    onSuccess: () => {
      // Invalidate and refetch videos
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      onClose()
    },
    onError: (error: any) => {
      console.error('Upload error:', error.message)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to upload video. '
      
      if (error.message.includes('row-level security policy')) {
        errorMessage += 'Please make sure you are logged in and have a complete profile. Try refreshing the page.'
      } else if (error.message.includes('violates foreign key constraint')) {
        errorMessage += 'Please complete your profile setup and try again.'
      } else if (error.message.includes('permission denied')) {
        errorMessage += 'You do not have permission to upload videos. Please check your account status.'
      } else {
        errorMessage += error.message
      }
      
      alert(errorMessage)
    },
    onSettled: () => {
      setUploading(false)
      setUploadProgress(0)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    uploadMutation.mutate()
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setTitle('')
    setDescription('')
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Video className="h-5 w-5" />
            Upload Video
          </DialogTitle>
          <DialogDescription>
            Share your content with the community. Upload a video up to 100MB.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!file ? (
            <Card 
              {...getRootProps()} 
              className={`
                border-2 border-dashed cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted'} transition-colors`}>
                    {isDragActive ? (
                      <FileVideo className="h-8 w-8 text-primary mx-auto" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {isDragActive ? 'Drop your video here' : 'Choose a video to upload'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your video file, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP4, MOV, AVI, WMV, FLV, WebM (max 100MB)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Video Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Video Preview</CardTitle>
                  <CardDescription>
                    {file.name} • {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    {preview && (
                      <video
                        src={preview}
                        controls
                        className="w-full h-64 object-contain"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={clearFile}
                      className="absolute top-2 right-2 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {uploading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading video...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Video Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Video Details</CardTitle>
                  <CardDescription>
                    Add a title and description to help people discover your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                      placeholder="Add a title to your video"
                      maxLength={100}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {title.length}/100 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <div className="relative">
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        placeholder="Tell viewers about your video"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        rows={3}
                        maxLength={500}
                        disabled={uploading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {description.length}/500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Separator />
          
          {file && (
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={clearFile}
                disabled={uploading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Choose Different Video
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
