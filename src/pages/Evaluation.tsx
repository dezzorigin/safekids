import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const QUESTIONS = [
  {
    id: 1,
    question: "When there is an earthquake, what should you do FIRST?",
    options: ["Run outside immediately", "Drop, Cover, and Hold On", "Call your friend", "Open the window"],
    correct: 1,
    explanation: "Drop to the ground, take cover under a desk, and hold on until shaking stops!",
    emoji: "🌍"
  },
  {
    id: 2,
    question: "Your teacher says: 'Go straight to the school field!' What do you do?",
    options: ["Turn left to the canteen", "Walk to the school field", "Stay in the classroom", "Go to the toilet"],
    correct: 1,
    explanation: "\"Go straight\" means move forward to the destination — the school field!",
    emoji: "🏃"
  },
  {
    id: 3,
    question: "Which sentence gives a correct evacuation instruction?",
    options: ["Jump over the fence!", "Fly to safety!", "Turn right and go to the safe zone!", "Roll over the ground!"],
    correct: 2,
    explanation: "\"Turn right and go to the safe zone\" is a clear, safe evacuation instruction!",
    emoji: "🗣️"
  },
  {
    id: 4,
    question: "The police officer says: 'Stand beside the wall!' Where should you stand?",
    options: ["Behind the wall", "Next to the wall", "In front of the wall", "On top of the wall"],
    correct: 1,
    explanation: "\"Beside\" means next to something — standing next to the wall!",
    emoji: "🚔"
  },
  {
    id: 5,
    question: "During a tsunami warning, which instruction should you follow?",
    options: ["Go to the beach to see the wave", "Move to higher ground immediately!", "Wait at home for more news", "Jump in the water"],
    correct: 1,
    explanation: "Always move to higher ground immediately when there is a tsunami warning!",
    emoji: "🌊"
  },
]

type QuizPhase = 'intro' | 'playing' | 'result'

const INTRO_CONFETTI = [
  { color: '#FF6B6B', top: '10%', left: '8%', delay: '0s' },
  { color: '#FFE135', top: '25%', right: '10%', delay: '0.5s' },
  { color: '#4ECDC4', bottom: '15%', left: '12%', delay: '1s' },
  { color: '#74C0FC', bottom: '30%', right: '8%', delay: '1.5s' },
  { color: '#C77DFF', top: '15%', left: '85%', delay: '2s' },
  { color: '#FF9A3C', bottom: '5%', right: '45%', delay: '2.5s' },
]

const RESULT_CONFETTI = Array.from({ length: 20 }).map((_, idx) => {
  const colors = ['#FF6B6B', '#FFE135', '#4ECDC4', '#74C0FC', '#C77DFF', '#FF9A3C']
  return {
    id: idx,
    color: colors[idx % colors.length],
    left: `${(idx * 5) + (Math.random() * 4)}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${2 + Math.random() * 2}s`
  }
})

const PROGRESS_COLORS = ['bg-[#FF6B6B]', 'bg-[#FF9A3C]', 'bg-[#FFE135]', 'bg-[#4ECDC4]', 'bg-[#4ADE80]']

export default function Evaluation() {
  const [phase, setPhase] = useState<QuizPhase>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)

  // Timer logic
  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto wrong answer
          setSelected(-1) // -1 = time out
          setAnswers(prevAnswers => [...prevAnswers, false])
          setShowExplanation(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, currentQ, selected])

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return
    setSelected(optionIndex)
    const isCorrect = optionIndex === QUESTIONS[currentQ].correct
    setAnswers(prev => [...prev, isCorrect])
    setShowExplanation(true)
  }

  const handleNext = async () => {
    if (currentQ < 4) {
      setCurrentQ(prev => prev + 1)
      setSelected(null)
      setShowExplanation(false)
      setTimeLeft(20)
    } else {
      const finalScore = answers.filter(Boolean).length
      await saveToSupabase(finalScore, answers)
      setPhase('result')
    }
  }

  const handleReset = () => {
    setPhase('intro')
    setCurrentQ(0)
    setSelected(null)
    setAnswers([])
    setShowExplanation(false)
    setTimeLeft(20)
  }

  const score = answers.filter(Boolean).length
  const { studentGroup } = useAuth()

  const saveToSupabase = async (finalScore: number, finalAnswers: boolean[]) => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error } = await supabase
      .from('quiz_results')
      .insert({
        group_number: Number(studentGroup ?? 0),
        score: finalScore,
        answers: finalAnswers,
        percentage: Math.round((finalScore / 5) * 100),
        completed_at: new Date().toISOString(),
        session_id: sessionData?.id ?? null
      })

    if (error) console.error('Quiz save error:', error)
  }

  const getResultBg = () => {
    if (score === 5) return 'bg-[#4ADE80]/20'
    if (score >= 3) return 'bg-[#FFE135]/20'
    return 'bg-[#FF6B6B]/20'
  }

  const getTimerBorderColor = () => {
    if (timeLeft > 10) return 'border-[#4ADE80]'
    if (timeLeft > 5) return 'border-[#FFE135]'
    return 'border-[#FF6B6B]'
  }

  const currentProgressColor = PROGRESS_COLORS[currentQ] || 'bg-[#FFE135]'

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 relative overflow-hidden ${phase === 'result' ? getResultBg() : 'bg-[#FFFEF7]'}`}>
      <style>{`
        @keyframes rotateSquare {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-rotate-square {
          animation: rotateSquare 6s linear infinite;
        }
        @keyframes buttonPulse {
          0%, 100% { box-shadow: 6px 6px 0px #FF6B6B; }
          50% { box-shadow: 8px 8px 0px #FF6B6B, 0 0 20px rgba(255,107,107,0.3); }
        }
        .animate-button-pulse {
          animation: buttonPulse 2s ease-in-out infinite;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes optionPop {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes quakeShake {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          20% { transform: translate(-2px,2px) rotate(-1deg); }
          40% { transform: translate(2px,-2px) rotate(1deg); }
          60% { transform: translate(-2px,-1px) rotate(-0.5deg); }
          80% { transform: translate(1px,2px) rotate(0.5deg); }
        }
        .animate-quake-shake {
          animation: quakeShake 0.3s ease-in-out infinite;
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>

      {/* Confetti Animation for Results Phase */}
      {phase === 'result' && score >= 3 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {RESULT_CONFETTI.map((conf) => (
            <div
              key={conf.id}
              style={{
                position: 'absolute',
                top: '-20px',
                left: conf.left,
                width: '12px',
                height: '12px',
                backgroundColor: conf.color,
                animation: `confettiFall ${conf.duration} linear ${conf.delay} infinite`,
                border: '2px solid #1A1A2E'
              }}
            />
          ))}
        </div>
      )}

      {/* PHASE 1: INTRO SCREEN */}
      {phase === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full relative z-10">
          {/* Confetti Squares for Intro Screen */}
          {INTRO_CONFETTI.map((conf, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: conf.top,
                bottom: conf.bottom,
                left: conf.left,
                right: conf.right,
                backgroundColor: conf.color,
                animationDelay: conf.delay,
              }}
              className="w-12 h-12 border-3 border-[#1A1A2E] animate-rotate-square hidden sm:block pointer-events-none select-none shadow-[2px_2px_0px_#1A1A2E]"
            />
          ))}

          <div className="text-8xl animate-bounce mb-4 select-none">🎮</div>
          <h1 
            style={{
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              textShadow: '4px 4px 0px #FF6B6B'
            }}
            className="font-black text-[#1A1A2E] tracking-tight leading-none"
          >
            Game Quiz!
          </h1>
          <p className="text-lg text-gray-500 font-bold mt-4">
            5 Questions · Bahasa Inggris · Giving Instructions
          </p>

          {/* Rules Card */}
          <div 
            style={{
              background: 'repeating-linear-gradient(45deg, #FFE135 0px, #FFE135 2px, transparent 2px, transparent 12px)',
            }}
            className="border-4 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] p-6 w-full mt-10 text-left bg-white"
          >
            <div className="bg-white/95 p-4 border-2 border-[#1A1A2E]">
              <h3 className="font-black text-xl text-[#1A1A2E] mb-3 flex items-center gap-2">
                📋 Cara Main
              </h3>
              <ul className="space-y-2 text-sm font-black text-[#1A1A2E]">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>5 pertanyaan Bahasa Inggris</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Setiap soal punya waktu 20 detik ⏱️</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Jawab dengan benar untuk dapat poin!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Hasil langsung masuk ke papan skor guru</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={() => setPhase('playing')}
            className="w-full bg-[#1A1A2E] text-[#FFE135] font-black text-xl border-4 border-[#1A1A2E] px-16 py-5 mt-10 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#FF6B6B] transition-all duration-200 animate-button-pulse"
          >
            Mulai Quiz! 🚀
          </button>
        </div>
      )}

      {/* PHASE 2: PLAYING SCREEN */}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col w-full relative z-10">
          {/* Top Bar */}
          <div className="bg-[#1A1A2E] text-white px-6 py-4 flex justify-between items-center border-b-4 border-[#1A1A2E] select-none">
            <div className="flex items-center gap-4">
              <span className="font-black text-base md:text-lg">
                Soal {currentQ + 1} / 5
              </span>
              <div className="bg-white/20 h-3 w-32 md:w-40 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-500 ${currentProgressColor}`}
                  style={{ width: `${((currentQ + 1) / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Timer Circle */}
            <div
              className={`w-12 h-12 rounded-full border-4 ${getTimerBorderColor()} flex items-center justify-center bg-white text-[#1A1A2E] ${
                timeLeft <= 5 ? 'animate-pulse animate-quake-shake' : ''
              }`}
            >
              <span className="font-black text-lg">{timeLeft}</span>
            </div>
          </div>

          {/* Question Area */}
          <div className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-between">
            <div>
              {/* Question Card */}
              <div 
                key={currentQ}
                className="bg-white border-4 border-[#1A1A2E] shadow-[8px_8px_0px_#1A1A2E] p-8 relative flex flex-col items-center text-center animate-slide-in-right"
              >
                <div className="text-6xl mb-4 select-none">
                  {QUESTIONS[currentQ].emoji}
                </div>
                <span className="bg-[#FF6B6B] text-white font-black text-xs px-3 py-1 border-2 border-[#1A1A2E]">
                  QUESTION {currentQ + 1}
                </span>
                <h2 className="font-black text-2xl md:text-3xl text-[#1A1A2E] mt-4 leading-snug">
                  {QUESTIONS[currentQ].question}
                </h2>
              </div>

              {/* Answer Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {QUESTIONS[currentQ].options.map((option, idx) => {
                  const isCorrectAnswer = idx === QUESTIONS[currentQ].correct
                  const isSelectedAnswer = idx === selected
                  const hasAnswered = selected !== null

                  let optionStyle = 'bg-white text-[#1A1A2E] border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A2E] active:translate-y-0 active:shadow-[2px_2px_0px_#1A1A2E]'
                  let icon = null

                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      optionStyle = 'bg-[#4ADE80] text-black border-[#16a34a] shadow-[4px_4px_0px_#16a34a] cursor-default'
                      icon = <span className="font-black text-xl text-[#16a34a] ml-auto">✓</span>
                    } else if (isSelectedAnswer) {
                      optionStyle = 'bg-[#FF6B6B] text-white border-[#dc2626] shadow-[4px_4px_0px_#dc2626] cursor-default'
                      icon = <span className="font-black text-xl text-[#dc2626] ml-auto">✗</span>
                    } else {
                      optionStyle = 'bg-white text-[#1A1A2E] border-[#1A1A2E] opacity-50 cursor-default'
                    }
                  }

                  return (
                    <button
                      key={`${currentQ}-${idx}`}
                      onClick={() => handleSelect(idx)}
                      disabled={hasAnswered}
                      style={{
                        animation: `optionPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 100}ms forwards`,
                        opacity: 0,
                      }}
                      className={`flex items-center text-left font-black text-base md:text-lg p-4 border-4 transition-all duration-200 ${optionStyle}`}
                    >
                      <span className="bg-[#FFE135] border-2 border-[#1A1A2E] w-8 h-8 font-black text-sm flex-shrink-0 flex items-center justify-center mr-3 text-[#1A1A2E]">
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      <span className="flex-grow">{option}</span>
                      {icon}
                    </button>
                  )
                })}
              </div>

              {/* Explanation Box */}
              {showExplanation && (
                <div className="bg-[#74C0FC]/20 border-4 border-[#74C0FC] p-4 mt-6 animate-slide-up flex items-start gap-2.5">
                  <span className="text-xl select-none">💡</span>
                  <p className="font-bold text-sm text-[#1A1A2E]">
                    {QUESTIONS[currentQ].explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Next Button */}
            {selected !== null && (
              <div className="mt-8 pb-4">
                <button
                  onClick={handleNext}
                  className="w-full bg-[#1A1A2E] text-[#FFE135] font-black text-lg py-4 border-4 border-[#1A1A2E] shadow-[6px_6px_0px_#FF6B6B] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#FF6B6B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#FF6B6B] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {currentQ < 4 ? 'Soal Berikutnya →' : 'Lihat Hasil →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 3: RESULT SCREEN */}
      {phase === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full animate-slide-up relative z-10">
          
          <div className="text-6xl mb-6 select-none animate-bounce">🚀</div>
          
          <h2 className="font-black text-3xl md:text-4xl text-[#1A1A2E] mb-4 leading-tight">
            Jawaban Terkirim!
          </h2>
          <p className="text-xl text-[#1A1A2E]/80 font-bold max-w-md mx-auto">
            Jawaban kamu sudah dikirim! Lihat papan skor di layar guru.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-10 max-w-sm mx-auto">
            <button
              onClick={handleReset}
              className="flex-1 bg-white text-[#1A1A2E] font-black text-lg py-4 border-4 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#1A1A2E] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-200 flex items-center justify-center gap-2"
            >
              🔄 Ulangi Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
