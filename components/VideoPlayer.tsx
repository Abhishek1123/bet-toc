'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react'
import { Video, User } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface VideoPlayerProps {
  video: Video
  onNext: () => void
  isActive: boolean
}

export function VideoPlayer({ video, onNext, isActive }: VideoPlayerProps) {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [liked, setLiked] = useState(video.is_liked || false)

  // Query to check if current user liked this video
  const { data: likeData } = useQuery({
    queryKey: ['like', video.id, user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', video.id)
        .single()
      return data
    },
    enabled: !!user && !video.is_liked && !!supabase,
  })

  useEffect(() => {
    setLiked(!!likeData || video.is_liked || false)
  }, [likeData, video.is_liked])

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in')
      if (!supabase) throw new Error('Supabase not configured')
      
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', video.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, video_id: video.id })
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      setLiked(!liked)
    },
  })

  // View tracking mutation
  const viewMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) return
      const { error } = await supabase.rpc('increment_view_count', { video_id: video.id })
      if (error) throw error
    },
  })

  const handlePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleVideoEnd = () => {
    onNext()
  }

  const handleVideoClick = () => {
    handlePlayPause()
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    likeMutation.mutate()
  }

  // Auto play when video becomes active
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  // Track view after 3 seconds
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        viewMutation.mutate()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isActive, viewMutation])

  return (
    <div className="video-container" onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)}>
      <video
        ref={videoRef}
        src={video.video_url}
        className="video-player"
        loop
        muted
        playsInline
        onEnded={handleVideoEnd}
        onClick={handleVideoClick}
        onLoadedData={() => {
          if (isActive) {
            videoRef.current?.play()
            setIsPlaying(true)
          }
        }}
      />
      
      {/* Video Info Overlay */}
      <div className="absolute bottom-4 left-4 right-20 flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700">
            {video.user.avatar_url ? (
              <Image
                src={video.user.avatar_url}
                alt={video.user.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold">
                {video.user.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">@{video.user.username}</span>
            {video.description && (
              <p className="text-sm text-gray-300 line-clamp-2">{video.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Interaction Panel */}
      <div className="side-panel">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={!user || likeMutation.isPending}
          className={`interaction-btn ${liked ? 'text-red-500' : 'text-white'}`}
        >
          <Heart
            size={32}
            className={liked ? 'fill-current' : ''}
          />
          <span className="text-xs">{video.like_count + (liked ? 1 : 0)}</span>
        </button>

        {/* Comment Button */}
        <button className="interaction-btn text-white">
          <MessageCircle size={32} />
          <span className="text-xs">{video.comment_count}</span>
        </button>

        {/* Share Button */}
        <button className="interaction-btn text-white">
          <Share size={32} />
        </button>

        {/* More Options */}
        <button className="interaction-btn text-white">
          <MoreHorizontal size={32} />
        </button>
      </div>
    </div>
  )
}
