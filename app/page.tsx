'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { VideoPlayer } from '@/components/VideoPlayer'
import { VideoUpload } from '@/components/VideoUpload'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Video } from '@/types/database'
import { Home, Search, Plus, User, LogOut, Menu, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(*),
          likes!left(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      // Transform data to add is_liked property
      const videosWithLikes = (data || []).map((video: any) => ({
        ...video,
        is_liked: video.likes?.some((like: any) => like.user_id === user?.id) || false,
        is_following: false // TODO: Check if user is following this user
      }))
      
      return videosWithLikes as Video[]
    },
    enabled: !!user && !!supabase,
  })

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">TikTok Clone</h1>
          <p className="text-gray-400 mb-8">Please sign in to continue</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const currentVideo = videos[currentVideoIndex]

  if (!currentVideo) {
    return (
      <>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full mb-6">
                <Upload className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">No videos found</h2>
              <p className="text-gray-400 mb-8">Be the first to share your video with the world!</p>
            </div>
            <Button 
              onClick={() => setShowUpload(true)}
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-semibold px-8 py-3 rounded-lg flex items-center space-x-2 mx-auto"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Your First Video</span>
            </Button>
          </div>
        </div>
        {showUpload && (
          <VideoUpload onClose={() => setShowUpload(false)} />
        )}
      </>
    )
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gray-900 flex-col z-30">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">TikTok</h1>
        </div>
        
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-800 rounded-lg">
                <Home size={20} />
                <span>Home</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                <Search size={20} />
                <span>Explore</span>
              </a>
            </li>
            <li>
              <button 
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left"
              >
                <Plus size={20} />
                <span>Upload</span>
              </button>
            </li>
            <li>
              <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                <User size={20} />
                <span>Profile</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg w-full"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-between px-4 z-40">
        <button onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <Menu size={24} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">TikTok</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-white">TikTok</h1>
            </div>
            
            <nav className="flex-1 px-4">
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-800 rounded-lg">
                    <Home size={20} />
                    <span>Home</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                    <Search size={20} />
                    <span>Explore</span>
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setShowUpload(true)
                      setShowMobileMenu(false)
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg w-full text-left"
                  >
                    <Plus size={20} />
                    <span>Upload</span>
                  </button>
                </li>
                <li>
                  <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                    <User size={20} />
                    <span>Profile</span>
                  </a>
                </li>
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg w-full"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Feed */}
      <div className="md:ml-64 pt-16 md:pt-0">
        <VideoPlayer
          video={currentVideo}
          onNext={handleNext}
          isActive={true}
        />
      </div>

      {/* Floating Upload Button */}
      <Button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Video Upload Modal */}
      {showUpload && (
        <VideoUpload onClose={() => setShowUpload(false)} />
      )}

      {/* Video Progress Indicator */}
      <div className="fixed bottom-4 left-4 right-20 md:left-72 flex flex-col space-y-2">
        <div className="flex space-x-1">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === currentVideoIndex ? 'bg-white' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
