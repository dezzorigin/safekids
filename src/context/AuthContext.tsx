import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthContextType = {
  user: any | null
  isTeacher: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  studentGroup: number | null
  setStudentGroup: (group: number) => void
  clearStudentGroup: () => void
  isStudent: boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({} as any)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    }).catch(() => {
      if (mounted) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const [studentGroup, setStudentGroupState] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('studentGroup')
    return stored ? parseInt(stored, 10) : null
  })

  const setStudentGroup = (group: number) => {
    sessionStorage.setItem('studentGroup', group.toString())
    setStudentGroupState(group)
  }

  const clearStudentGroup = () => {
    sessionStorage.removeItem('studentGroup')
    setStudentGroupState(null)
  }

  // Teacher = logged in with Supabase auth
  const isTeacher = !!user

  // isStudent = has group selected BUT not logged in as teacher
  const isStudent = !user && studentGroup !== null

  return (
    <AuthContext.Provider
      value={{
        user,
        isTeacher,
        isLoading,
        signIn,
        signUp,
        signOut,
        studentGroup,
        setStudentGroup,
        clearStudentGroup,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext)
