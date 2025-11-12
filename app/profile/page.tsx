'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Video } from '@/types/database'
import { User, Video as VideoIcon, Settings, Edit3, Grid, Heart, BookOpen, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditProfileDialog } from '@/components/EditProfileDialog'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState(() => {
  const storedTab = localStorage.getItem('activeTab')
  return storedTab ? storedTab : 'videos'
})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const router = useRouter()

  // Redirect if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth/signin')
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Fetch user's videos
  const { data: userVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['user-videos', user.id],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(*),
          likes!left(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const videosWithLikes = (data || []).map((video: any) => ({
        ...video,
        is_liked: video.likes?.some((like: any) => like.user_id === user.id) || false,
      }))
      
      return videosWithLikes as any[]
    },
    enabled: !!user && !!supabase,
  })

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user.id],
    queryFn: async () => {
      if (!supabase) return { videos: 0, likes: 0, followers: 0 }
      
      const [videosCount, likesCount, followersCount] = await Promise.all([
        supabase
          .from('videos')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('likes')
          .select('id', { count: 'exact' })
          .in('video_id', userVideos.map(v => v.id)),
        supabase
          .from('follows')
          .select('id', { count: 'exact' })
          .eq('following_id', user.id)
      ])

      return {
        videos: videosCount.count || 0,
        likes: likesCount.count || 0,
        followers: followersCount.count || 0,
      }
    },
    enabled: !!user && !!supabase && userVideos.length > 0,
  })

  // Fetch liked videos
  const { data: likedVideos = [], isLoading: likedLoading } = useQuery({
    queryKey: ['liked-videos', user.id],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('likes')
        .select(`
          video_id,
          videos(
            *,
            user:users(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return (data || [])
        .filter((like: any) => like.videos)
        .map((like: any) => like.videos) as any[]
    },
    enabled: !!user && !!supabase,
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleShareProfile = async () => {
    if (!user) return
    
    const shareUrl = `${window.location.origin}/profile/${user.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my TikTok profile!',
          text: 'Join me on TikTok',
          url: shareUrl
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Profile link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    }
  }

  const getInitials = (email: string | undefined) => {
    return email ? email.split('@')[0].charAt(0).toUpperCase() : 'U'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gray-900 flex-col z-30">
        <div className="p-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg flex items-center justify-center">
              <VideoIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TikTok</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            <li>
              <Link href="/" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                <Grid size={20} />
                <span>For You</span>
              </Link>
            </li>
            <li>
              <Link href="/explore" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                <BookOpen size={20} />
                <span>Explore</span>
              </Link>
            </li>
            <li>
              <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-800 rounded-lg">
                <User size={20} />
                <span>Profile</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg w-full"
          >
            <Settings size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-between px-4 z-40">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-violet-500 rounded flex items-center justify-center">
            <VideoIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">TikTok</span>
        </Link>
        <div className="w-6" />
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.email}&background=ec4899&color=fff`} />
                <AvatarFallback className="text-4xl bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </h1>
                <p className="text-gray-400 mb-4">@{user.email?.split('@')[0]}</p>
                <p className="text-gray-300 mb-6 max-w-md">
                  Welcome to my profile! Follow me for amazing content.
                </p>
                
                {/* Stats */}
                {userStats && (
                  <div className="flex justify-center md:justify-start space-x-8 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{userStats.videos}</div>
                      <div className="text-gray-400 text-sm">Videos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{userStats.likes}</div>
                      <div className="text-gray-400 text-sm">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{userStats.followers}</div>
                      <div className="text-gray-400 text-sm">Followers</div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button 
                    onClick={() => setEditDialogOpen(true)}
                    className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    onClick={handleShareProfile}
                    variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === 'videos'
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>Videos</span>
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
                activeTab === 'liked'
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Liked</span>
            </button>
          </div>

          {/* Videos Grid */}
          {activeTab === 'videos' && (
            <div>
              {videosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : userVideos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <VideoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No videos yet</h3>
                  <p className="text-gray-400 mb-6">Start creating content to see your videos here</p>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                      Upload First Video
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userVideos.map((video) => (
                    <Card key={video.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer overflow-hidden group">
                      <CardContent className="p-0">
                        <div className="aspect-[3/4] bg-gray-700 relative overflow-hidden">
                          <video
                            src={video.video_url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                            {video.duration ? `${Math.floor(video.duration)}s` : ''}
                          </Badge>
                          <div className="absolute bottom-2 right-2 text-white text-sm font-medium flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{video.likes?.length || 0}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-white text-sm line-clamp-2">{video.title || 'Untitled video'}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Liked Videos */}
          {activeTab === 'liked' && (
            <div>
              {likedLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : likedVideos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No liked videos</h3>
                  <p className="text-gray-400">Videos you like will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {likedVideos.map((video) => (
                    <Card key={video.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer overflow-hidden group">
                      <CardContent className="p-0">
                        <div className="aspect-[3/4] bg-gray-700 relative overflow-hidden">
                          <video
                            src={video.video_url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                            {video.duration ? `${Math.floor(video.duration)}s` : ''}
                          </Badge>
                          <div className="absolute bottom-2 right-2 text-white text-sm font-medium flex items-center space-x-1">
                            <Heart className="w-3 h-3 fill-current" />
                            <span>{video.like_count || 0}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-white text-sm line-clamp-2">{video.title || 'Untitled video'}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Profile Dialog */}
          <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
        </div>
      </div>
    </div>
  )
}