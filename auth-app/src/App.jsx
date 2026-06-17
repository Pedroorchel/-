import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Welcome from './pages/Welcome'
import { supabase } from './supabaseClient'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [screen, setScreen] = useState('login')

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar profile:', error.message)
      setProfile(null)
      return
    }

    setProfile(data)
  }

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        setScreen('welcome')
        await loadProfile(currentUser.id)
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setScreen(currentUser ? 'welcome' : 'login')
      loadProfile(currentUser?.id)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {screen === 'login' && (
          <Login onRegister={() => setScreen('register')} onLogin={() => setScreen('welcome')} />
        )}

        {screen === 'register' && (
          <Register onCancel={() => setScreen('login')} onRegistered={() => setScreen('welcome')} />
        )}

        {screen === 'welcome' && (
          <Welcome
            onSignOut={async () => {
              await supabase.auth.signOut()
              setScreen('login')
              setProfile(null)
            }}
            user={user}
            profile={profile}
          />
        )}
      </div>
    </div>
  )
}
