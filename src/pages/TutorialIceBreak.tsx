import { useState, useRef, useEffect } from 'react'

const SONG_URL = "https://xvnygipwhrzkjqjhkujt.supabase.co/storage/v1/object/public/jak%20plueng%20song/Step_by_Step_to_Safety.mp4"

export default function TutorialIceBreak() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1.0)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(err => console.error("Audio playback failed:", err))
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const width = rect.width
      const clickPercent = clickX / width
      const newTime = clickPercent * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
      setProgress(clickPercent * 100)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
    }
  }

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s/60)
    const sec = Math.floor(s%60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-full bg-[#FFFEF7] w-full p-8">
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
        {/* === SECTION 1: TUTORIAL VIDEO === */}
        <div
          className="bg-white border-4 border-[#1A1A2E] overflow-hidden p-4"
          style={{ boxShadow: '6px 6px 0px #1A1A2E' }}
        >
          {/* Header */}
          <div className="mb-6">
            <span className="bg-[#74C0FC] text-[#1A1A2E] font-black text-xs px-3 py-1.5 border-2 border-[#1A1A2E] inline-block mb-3 select-none">
              🎮 TUTORIAL · 3D SIMULATOR
            </span>
            <h1 className="font-black text-3xl text-[#1A1A2E] mt-0" style={{ fontFamily: '"Nunito", sans-serif' }}>
              Tutorial Simulasi Evakuasi 3D
            </h1>
            <p className="text-base font-bold text-[#1A1A2E]/70 mt-1" style={{ fontFamily: '"Nunito", sans-serif' }}>
              Pelajari cara bermain ketiga level bencana
            </p>
          </div>

          {/* YouTube Iframe */}
          <div
            className="w-full overflow-hidden border-4 border-[#1A1A2E]"
            style={{
              boxShadow: '6px 6px 0px #1A1A2E',
              background: '#000',
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/CaleAY14_0Q?vq=hd1080&hd=1&rel=0&modestbranding=1"
              title="JAK PLUNG! Tutorial Simulasi Evakuasi 3D"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: '100%',
                height: '560px',
                maxWidth: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* === SECTION 2: LAGU ICE BREAK === */}
        <div
          className="bg-[#1A1A2E] border-4 border-[#FFE135] overflow-hidden p-8"
          style={{ boxShadow: '6px 6px 0px #FFE135' }}
        >
          {/* Header */}
          <div className="mb-6">
            <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-3 py-1.5 border-2 border-[#1A1A2E] inline-block mb-3 select-none">
              🎵 ICE BREAKING · LAGU JAK PLUNG!
            </span>
            <h1 className="font-black text-3xl text-white mt-0" style={{ fontFamily: '"Nunito", sans-serif' }}>
              Step by Step to Safety
            </h1>
            <p className="text-base font-bold text-gray-400 mt-1" style={{ fontFamily: '"Nunito", sans-serif' }}>
              Nyanyikan bersama!
            </p>
          </div>

          {/* Grid: 2 Columns */}
          <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
            {/* LEFT (45%): Cover art + audio player */}
            <div className="w-full lg:w-[45%] flex flex-col gap-6">
              {/* Cover Art */}
              <div
                style={{
                  height: '220px',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE135 50%, #4ECDC4 100%)',
                  border: '4px solid #FFE135',
                  boxShadow: '6px 6px 0px #FFE135',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                }}
                className="overflow-hidden relative select-none"
              >
                <span 
                  className={`text-6xl mb-2 block ${isPlaying ? 'animate-music-pulse' : ''}`}
                  style={{ fontSize: '48px' }}
                >
                  🎵
                </span>
                <h3 className="font-black text-2xl text-[#1A1A2E] m-0" style={{ fontFamily: '"Nunito", sans-serif' }}>
                  JAK PLUNG!
                </h3>
                <p className="text-sm font-bold text-[#1A1A2E]/80 m-0 mt-1" style={{ fontFamily: '"Nunito", sans-serif' }}>
                  Step by Step to Safety
                </p>
              </div>

              {/* Audio Element */}
              <audio
                ref={audioRef}
                src={SONG_URL}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime)
                    setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100)
                  }
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration)
                  }
                }}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />

              {/* Custom Audio Player UI */}
              <div
                className="bg-[#0D0D1A] border-4 border-[#FFE135] p-5 flex flex-col gap-4 rounded-xl"
                style={{ boxShadow: '4px 4px 0px #FFE135' }}
              >
                {/* Song info */}
                <div>
                  <h4 className="font-black text-white text-sm m-0" style={{ fontFamily: '"Nunito", sans-serif' }}>
                    Step by Step to Safety
                  </h4>
                  <p className="text-gray-400 text-xs m-0 mt-1" style={{ fontFamily: '"Nunito", sans-serif' }}>
                    JAK PLUNG! Theme Song
                  </p>
                </div>

                {/* Progress bar container */}
                <div className="w-full">
                  <div
                    onClick={handleProgressBarClick}
                    className="h-2 bg-gray-700 rounded-full cursor-pointer w-full mt-3 relative"
                  >
                    <div
                      className="bg-gradient-to-r from-[#FFE135] to-[#4ECDC4] h-full rounded-full relative"
                      style={{ width: `${progress}%` }}
                    >
                      {/* Thumb dot */}
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FFE135] rounded-full border-2 border-[#1A1A2E]"
                        style={{ transform: 'translate(50%, -50%)' }}
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5" style={{ fontFamily: '"Nunito", sans-serif' }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-center gap-6 mt-1">
                  {/* Rewind Button */}
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
                      }
                    }}
                    className="text-gray-400 hover:text-[#FFE135] text-xl transition-colors cursor-pointer select-none"
                    title="Rewind 10s"
                  >
                    ⏮
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    onClick={togglePlayPause}
                    style={{
                      width: '52px',
                      height: '52px',
                      backgroundColor: '#FFE135',
                      border: '4px solid #1A1A2E',
                      boxShadow: '4px 4px 0px #1A1A2E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      cursor: 'pointer',
                    }}
                    className={`rounded-full hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all ${isPlaying ? 'play-pulse' : ''}`}
                  >
                    <span style={{ color: '#1A1A2E' }}>{isPlaying ? '⏸' : '▶'}</span>
                  </button>

                  {/* Forward Button */}
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
                      }
                    }}
                    className="text-gray-400 hover:text-[#FFE135] text-xl transition-colors cursor-pointer select-none"
                    title="Forward 10s"
                  >
                    ⏭
                  </button>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-2 mt-2 justify-center text-gray-400 text-xs">
                  <span>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 accent-[#FFE135] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT (55%): Lyrics */}
            <div
              className="w-full lg:w-[55%] flex flex-col bg-[#0D0D1A] border-4 border-[#FFE135] p-6 rounded-xl overflow-hidden"
              style={{
                boxShadow: '4px 4px 0px #FFE135',
                maxHeight: '520px',
              }}
            >
              <h2 className="font-black text-xl text-[#FFE135] mb-4 select-none flex items-center gap-2" style={{ fontFamily: '"Nunito", sans-serif' }}>
                📝 Lirik Lagu
              </h2>

              <div
                className="overflow-y-auto pr-2 flex-1 custom-scrollbar text-center"
                style={{ fontFamily: '"Nunito", sans-serif' }}
              >
                {/* Verse 1 */}
                <div className="flex flex-col items-center">
                  <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-2.5 py-1 rounded mb-2 select-none">
                    Verse 1 - Earthquake 🌋
                  </span>
                  <p className="text-gray-300 text-sm leading-loose m-0 font-bold">
                    When the ground begins to shake,<br />
                    Don't you cry and don't you quake!<br />
                    Cover up and stay low down,<br />
                    Safest kids in all the town.
                  </p>
                </div>

                <div className="border-b border-gray-700 my-4" />

                {/* Chorus 1 */}
                <div className="flex flex-col items-center">
                  <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-2.5 py-1 rounded mb-2 select-none">
                    Chorus 🎵
                  </span>
                  <p className="text-gray-300 text-sm leading-loose m-0 font-bold">
                    <span className="text-[#FFE135] font-black">JAK PLUNG!</span> <span className="text-[#FFE135] font-black">JAK PLUNG!</span> We are smart!<br />
                    <span className="text-[#FFE135] font-black">JAK PLUNG!</span> <span className="text-[#FFE135] font-black">JAK PLUNG!</span> Do your part!<br />
                    Move forward now, don't walk alone,<br />
                    Everybody, go to safe zone!
                  </p>
                </div>

                <div className="border-b border-gray-700 my-4" />

                {/* Verse 2 */}
                <div className="flex flex-col items-center">
                  <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-2.5 py-1 rounded mb-2 select-none">
                    Verse 2 - Flood 🌊
                  </span>
                  <p className="text-gray-300 text-sm leading-loose m-0 font-bold">
                    When the water fills the street,<br />
                    Keep the shoes upon your feet.<br />
                    Turn right at the yellow sign,<br />
                    Everything will be just fine.
                  </p>
                </div>

                <div className="border-b border-gray-700 my-4" />

                {/* Chorus 2 */}
                <div className="flex flex-col items-center">
                  <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-2.5 py-1 rounded mb-2 select-none">
                    Chorus 🎵
                  </span>
                  <p className="text-gray-300 text-sm leading-loose m-0 font-bold">
                    <span className="text-[#FFE135] font-black">JAK PLUNG!</span> <span className="text-[#FFE135] font-black">JAK PLUNG!</span> We are smart!<br />
                    <span className="text-[#FFE135] font-black">JAK PLUNG!</span> <span className="text-[#FFE135] font-black">JAK PLUNG!</span> Do your part!<br />
                    Move forward now, don't walk alone,<br />
                    Everybody, go to safe zone!
                  </p>
                </div>

                <div className="border-b border-gray-700 my-4" />

                {/* Verse 3 */}
                <div className="flex flex-col items-center">
                  <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-2.5 py-1 rounded mb-2 select-none">
                    Verse 3 - Tsunami 🌊
                  </span>
                  <p className="text-gray-300 text-sm leading-loose m-0 font-bold">
                    If the ocean pulls away,<br />
                    We can't stay around to play.<br />
                    Hold your bag and grab your friend,<br />
                    We'll be happy in the end!
                  </p>
                </div>

                <div className="border-b border-gray-700 my-4" />

                {/* Chorus 3 */}
                <div className="flex flex-col items-center">
                  <span className="bg-[#FFE135] text-[#1A1A2E] font-black text-xs px-2.5 py-1 rounded mb-2 select-none">
                    Chorus 🎵
                  </span>
                  <p className="text-gray-300 text-sm leading-loose m-0 font-bold">
                    <span className="text-[#FFE135] font-black">JAK PLUNG!</span> <span className="text-[#FFE135] font-black">JAK PLUNG!</span> We are smart!<br />
                    <span className="text-[#FFE135] font-black">JAK PLUNG!</span> <span className="text-[#FFE135] font-black">JAK PLUNG!</span> Do your part!<br />
                    Move forward now, don't walk alone,<br />
                    Everybody, go to safe zone!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes musicPulse {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(15deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-music-pulse {
          animation: musicPulse 1.8s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes playPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 225, 53, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 225, 53, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 225, 53, 0); }
        }
        .play-pulse {
          animation: playPulse 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0d0d1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FFE135;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}




