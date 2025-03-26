'use client'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { supabase } from '../lib/supabase';


export default function Navbar({ currentBuilding }) {
  const { user } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              PNW Map
            </Link>
            {currentBuilding && (
              <span className="ml-4 text-gray-600">
                Location: {currentBuilding}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/events" className="text-gray-600 hover:text-gray-900">
              Events
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Premium features for logged in users */}
                <Link href="/favorites" className="text-gray-600 hover:text-gray-900">
                  My Favorites
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </Link>
                <Link 
                  href="/auth/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}