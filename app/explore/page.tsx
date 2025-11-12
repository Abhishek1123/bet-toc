'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Video } from '@/types/database'
import { Video as VideoIcon, TrendingUp, Hash, Users, Grid, BookOpen, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ExplorePage() {
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('trending')
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

  // Fetch trending videos
  const { data: trendingVideos = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-videos'],
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
      
      const videosWithLikes = (data || []).map((video: any) => ({
        ...video,
        is_liked: video.likes?.some((like: any) => like.user_id === user.id) || false,
        like_count: video.likes?.length || 0,
      }))
      
      return videosWithLikes.sort((a, b) => b.like_count - a.like_count) as any[]
    },
    enabled: !!user && !!supabase,
  })

  // Fetch popular creators
  const { data: popularCreators = [] } = useQuery({
    queryKey: ['popular-creators'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          videos(count),
          followers(count)
        `)
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: !!user && !!supabase,
  })

  // Search functionality
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-videos', searchQuery],
    queryFn: async () => {
      if (!supabase || !searchQuery.trim()) return []
      
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(*),
          likes!left(*)
        `)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      return (data || []).map((video: any) => ({
        ...video,
        is_liked: video.likes?.some((like: any) => like.user_id === user.id) || false,
      })) as any[]
    },
    enabled: !!user && !!supabase && !!searchQuery.trim(),
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const categories = [
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'music', name: 'Music', icon: Hash },
    { id: 'dance', name: 'Dance', icon: Users },
    { id: 'comedy', name: 'Comedy', icon: VideoIcon },
  ]

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
              <Link href="/explore" className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-800 rounded-lg">
                <BookOpen size={20} />
                <span>Explore</span>
              </Link>
            </li>
            <li>
              <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg">
                <Users size={20} />
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
            <VideoIcon size={20} />
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
        <div className="max-w-6xl mx-auto p-6">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search videos, creators, hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-pink-500"
              />
            </div>
          </div>

          {searchQuery.trim() ? (
            // Search Results
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Search results for "{searchQuery}"
              </h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                  <p className="text-gray-400">Try searching for something else</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((video: any) => (
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
                            <TrendingUp className="w-3 h-3" />
                            <span>{video.likes?.length || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Main Explore Content
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Explore</h1>
                <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                  {trendingVideos.length} videos
                </Badge>
              </div>

              <Tabs defaultValue="trending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-800">
                  <TabsTrigger value="trending" className="data-[state=active]:bg-pink-500">
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="data-[state=active]:bg-pink-500">
                    Creators
                  </TabsTrigger>
                  <TabsTrigger value="hashtags" className="data-[state=active]:bg-pink-500">
                    Hashtags
                  </TabsTrigger>
                  <TabsTrigger value="sounds" className="data-[state=active]:bg-pink-500">
                    Sounds
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trending" className="mt-8">
                  {trendingLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {trendingVideos.map((video: any, index) => (
                        <Card key={video.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer overflow-hidden group relative">
                          <CardContent className="p-0">
                            <div className="aspect-[3/4] bg-gray-700 relative overflow-hidden">
                              <video
                                src={video.video_url}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              {index < 3 && (
                                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                  #{index + 1}
                                </Badge>
                              )}
                              <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                                {video.duration ? `${Math.floor(video.duration)}s` : ''}
                              </Badge>
                              <div className="absolute bottom-2 right-2 text-white text-sm font-medium flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{video.likes?.length || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="creators" className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popularCreators.map((creator: any) => (
                      <Card 
                        key={creator.id} 
                        className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                        onClick={() => router.push(`/creator/${creator.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-16 h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/creator/${creator.id}`)
                              }}
                            >
                              <span className="text-white font-bold text-lg">
                                {creator.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold truncate">@{creator.username || creator.email?.split('@')[0]}</h3>
                              <p className="text-gray-400 text-sm">{creator.video_count || 0} videos</p>
                              <p className="text-gray-400 text-sm">{creator.follower_count || 0} followers</p>
                            </div>
                            <Button 
                              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toast.success('Followed!')
                              }}
                            >
                              Follow
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="hashtags" className="mt-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {['#trending', '#viral', '#dance', '#music', '#comedy', '#fashion', '#food', '#travel'].map((hashtag) => (
                      <Card key={hashtag} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer">
                        <CardContent className="p-6 text-center">
                          <Hash className="w-8 h-8 text-pink-400 mx-auto mb-3" />
                          <h3 className="text-white font-bold">{hashtag}</h3>
                          <p className="text-gray-400 text-sm">1.2M videos</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sounds" className="mt-8">
                  <div className="space-y-4">
                    {[
                      { name: 'Original Sound - @user123', plays: '1.2M' },
                      { name: 'Summer Vibes - Music Trend', plays: '850K' },
                      { name: 'Dance Challenge Sound', plays: '650K' },
                      { name: 'Comedy Audio - @creator', plays: '420K' },
                    ].map((sound, index) => (
                      <Card key={index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
                                <VideoIcon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{sound.name}</h3>
                                <p className="text-gray-400 text-sm">{sound.plays} plays</p>
                              </div>
                            </div>
                            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                              Use
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}