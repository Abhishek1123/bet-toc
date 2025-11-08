'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { VideoPlayer } from '@/components/VideoPlayer'
import { VideoUpload } from '@/components/VideoUpload'
import { LandingPage } from '@/components/LandingPage'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Video } from '@/types/database'
import { Home, Search, Plus, User, LogOut, Menu, Upload, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

// Authenticated Home Component
function AuthenticatedHome() {
  const { user, signOut } = useAuth()
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null)
  
  const touchStartY = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Swipe handling functions
  const handleSwipeUp = () => {
    if (isTransitioning) return
    if (currentVideoIndex < videos.length - 1) {
      setIsTransitioning(true)
      setSwipeDirection('up')
      setTimeout(() => {
        setCurrentVideoIndex(currentVideoIndex + 1)
        setIsTransitioning(false)
        setSwipeDirection(null)
      }, 300)
    }
  }

  const handleSwipeDown = () => {
    if (isTransitioning) return
    if (currentVideoIndex > 0) {
      setIsTransitioning(true)
      setSwipeDirection('down')
      setTimeout(() => {
        setCurrentVideoIndex(currentVideoIndex - 1)
        setIsTransitioning(false)
        setSwipeDirection(null)
      }, 300)
    }
  }

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleSwipeUp()
      } else {
        handleSwipeDown()
      }
    }
    
    touchStartY.current = null
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleSwipeDown()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleSwipeUp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentVideoIndex, isTransitioning])

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
              <div className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-800 rounded-lg">
                <Home size={20} />
                <span>Home</span>
              </div>
            </li>
            <li>
              <Link href="/explore" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                <Search size={20} />
                <span>Explore</span>
              </Link>
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
              <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
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
                  <div className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-800 rounded-lg">
                    <Home size={20} />
                    <span>Home</span>
                  </div>
                </li>
                <li>
                  <Link 
                    href="/explore"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                  >
                    <Search size={20} />
                    <span>Explore</span>
                  </Link>
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
                  <Link 
                    href="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                  >
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
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Feed with Swipe Support */}
      <div 
        className="md:ml-64 pt-16 md:pt-0 relative"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`transition-transform duration-300 ease-out ${
          swipeDirection === 'up' ? '-translate-y-full' : 
          swipeDirection === 'down' ? 'translate-y-full' : ''
        } ${isTransitioning ? 'opacity-80' : 'opacity-100'}`}>
          <VideoPlayer
            video={currentVideo}
            onNext={handleNext}
            isActive={true}
          />
        </div>

        {/* Swipe Navigation Hints */}
        {!isTransitioning && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Up Swipe Indicator */}
            {currentVideoIndex < videos.length - 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
                  <ChevronUp className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
            
            {/* Down Swipe Indicator */}
            {currentVideoIndex > 0 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
                  <ChevronDown className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Swipe Status Indicator */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-white font-medium">
                {swipeDirection === 'up' ? 'Loading next video...' : 'Loading previous video...'}
              </p>
            </div>
          </div>
        )}
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

      {/* Swipe Navigation Controls */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3">
        {/* Up Button */}
        {currentVideoIndex < videos.length - 1 && (
          <Button
            onClick={handleSwipeUp}
            disabled={isTransitioning}
            size="icon"
            className="w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 text-white shadow-lg"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        )}
        
        {/* Down Button */}
        {currentVideoIndex > 0 && (
          <Button
            onClick={handleSwipeDown}
            disabled={isTransitioning}
            size="icon"
            className="w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 text-white shadow-lg"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Video Progress Indicator */}
      <div className="fixed bottom-4 left-4 right-20 md:left-72 flex flex-col space-y-2 z-30">
        <div className="flex space-x-1">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors cursor-pointer hover:h-1.5 ${
                index === currentVideoIndex ? 'bg-white' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              onClick={() => {
                if (!isTransitioning && index !== currentVideoIndex) {
                  setIsTransitioning(true)
                  const direction = index > currentVideoIndex ? 'up' : 'down'
                  setSwipeDirection(direction)
                  setTimeout(() => {
                    setCurrentVideoIndex(index)
                    setIsTransitioning(false)
                    setSwipeDirection(null)
                  }, 300)
                }
              }}
            />
          ))}
        </div>
        <div className="text-center">
          <span className="text-xs text-white/60 bg-black/20 px-2 py-1 rounded-full">
            {currentVideoIndex + 1} / {videos.length}
          </span>
        </div>
      </div>
    </div>
  )
}

// Main HomePage component
export default function HomePage() {
  const { user } = useAuth()

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />
  }

  // Show authenticated home for logged-in users
  return <AuthenticatedHome />
}
