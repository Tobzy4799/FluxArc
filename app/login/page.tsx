'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/admin/withdraw')
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-[#05030f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0e0b2e]/30 border border-fuchsia-900/20 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">Admin Access</h1>
        <div className="text-fuchsia-400">
          <Auth 
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#c026d3',
                    brandAccent: '#d946ef',
                    inputText: 'white'
                  },
                },
              }
            }}
            providers={[]} 
            redirectTo={`/auth/callback`}
          />
        </div>
      </div>
    </div>
  )
}