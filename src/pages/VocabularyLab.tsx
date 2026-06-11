export default function VocabularyLab() {
  return (
    <div className="p-8 h-full bg-[#FFFEF7]">
      <h1 className="text-4xl font-black text-[#1A1A2E] mb-2">📚 Vocabulary Lab</h1>
      <p className="text-sm font-bold text-[#1A1A2E]/60 mb-6">Eksplorasi kosakata bencana dalam AR — Assemblr</p>
      <div className="w-full h-[80vh] border-4 border-[#1A1A2E] shadow-brutal overflow-hidden">
        <iframe src="https://studio.assemblrworld.com/" className="w-full h-full border-none" />
      </div>
    </div>
  )
}
