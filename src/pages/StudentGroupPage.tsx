import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useCurtain } from '@/context/CurtainContext'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'

const GROUPS_DATA = [
  { number: 1, bg: '#FF6B6B', text: '#FFFFFF' },
  { number: 2, bg: '#74C0FC', text: '#1A1A2E' },
  { number: 3, bg: '#4ECDC4', text: '#1A1A2E' },
  { number: 4, bg: '#C77DFF', text: '#FFFFFF' },
  { number: 5, bg: '#FF9A3C', text: '#FFFFFF' },
]

export default function StudentGroupPage() {
  const navigate = useNavigate()
  const { triggerCurtain } = useCurtain()
  const { setStudentGroup } = useAuth()
  const [loadingGroup, setLoadingGroup] = useState<number | null>(null)
  
  const [availableGroups, setAvailableGroups] = useState<number[]>([])
  const [groupsData, setGroupsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroups = async () => {
      // 1. Get active session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sessionData?.id) {
        setCurrentSessionId(sessionData.id)
        
        // 2. Get groups for this session
        const { data, error } = await supabase
          .from('groups')
          .select('group_number, members')
          .eq('session_id', sessionData.id)
          .not('members', 'eq', '{}')  // non-empty members
        
        if (error) console.error(error)
        
        if (data && data.length > 0) {
          setAvailableGroups(data.map(g => g.group_number))
          setGroupsData(data)
        } else {
          setAvailableGroups([1,2,3,4,5])
          setGroupsData([])
        }
      } else {
        setAvailableGroups([1,2,3,4,5])
        setGroupsData([])
      }
      setLoading(false)
    }
    
    fetchGroups()
  }, [])

  const handleGroupSelect = async (groupNumber: number) => {
    if (loadingGroup !== null || !availableGroups.includes(groupNumber)) return
    setLoadingGroup(groupNumber)

    try {
      // 1. Set local student group
      setStudentGroup(groupNumber)

      // 2. Upsert to student_presence (no auth)
      if (currentSessionId) {
        await supabase
          .from('student_presence')
          .insert({
            group_number: groupNumber,
            current_page: '/mission',
            last_seen: new Date().toISOString(),
            session_id: currentSessionId
          })
      }
    } catch (err) {
      console.error('Failed to select group:', err)
    }
    // 3. Navigate with curtain
    triggerCurtain(() => navigate('/mission'))
  }

  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center',
      justifyContent:'center', height:'100vh',
      background:'#FFFEF7', fontWeight:900,
      fontSize:'24px'
    }}>
      🔄 Memuat kelompok...
    </div>
  )

  return (
    <div className="group-page-wrapper">
      <style>{`
        .group-page-wrapper {
          width: 100vw;
          height: 100vh;
          min-height: 100vh;
          background: repeating-linear-gradient(
            45deg,
            #FFFEF7,
            #FFFEF7 12px,
            #F9F7F0 12px,
            #F9F7F0 24px
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          overflow-x: hidden;
          padding: 24px;
        }

        .group-button {
          width: 160px;
          height: 160px;
          border: 4px solid #1A1A2E;
          font-family: 'Nunito', sans-serif;
          font-weight: 900;
          box-shadow: 6px 6px 0px #1A1A2E;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease;
        }

        .group-button:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 8px 8px 0px #1A1A2E;
        }

        .group-button:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 4px 4px 0px #1A1A2E;
        }

        .group-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pulse-loader {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 1.2s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-12 select-none">
        <h1 className="font-black text-4xl text-[#1A1A2E] tracking-tight">
          🎒 Pilih Kelompokmu!
        </h1>
        <p className="text-sm text-[#1A1A2E]/50 mt-2 font-bold tracking-wide">
          Pilih kelompok sesuai arahan gurumu
        </p>
      </div>

      {/* Group Buttons Container */}
      <div className="flex flex-wrap justify-center gap-6 max-w-5xl w-full">
        {GROUPS_DATA.map((group) => {
          const isSelected = loadingGroup === group.number;
          const isAvailable = availableGroups.includes(group.number);
          
          const thisGroup = groupsData.find(g => g.group_number === group.number)
          const members = thisGroup?.members ?? []
          
          return (
            <div key={group.number} className="flex flex-col items-center">
              <button
                disabled={loadingGroup !== null || !isAvailable}
                onClick={() => handleGroupSelect(group.number)}
                className="group-button rounded-none"
                style={{
                  backgroundColor: group.bg,
                  color: group.text,
                  opacity: isAvailable ? 1 : 0.35,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  filter: isAvailable ? 'none' : 'grayscale(1)',
                }}
              >
                {isSelected ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="pulse-loader" />
                    <span className="text-xs font-bold uppercase tracking-wider">Loading...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-5xl font-black">{group.number}</span>
                    <span className="text-sm font-bold uppercase tracking-wider">Kelompok</span>
                  </>
                )}
              </button>
              
              {isAvailable && members.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  justifyContent: 'center',
                  maxWidth: '160px'
                }}>
                  {members.map((name: string) => (
                    <span key={name} style={{
                      background: 'white',
                      border: '2px solid #1A1A2E',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      color: '#1A1A2E'
                    }}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}
