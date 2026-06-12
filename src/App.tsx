import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { CurtainProvider } from '@/context/CurtainContext'
import { AuthProvider } from '@/context/AuthContext'
import TeacherRoute from '@/components/layout/TeacherRoute'
import PageTransition from '@/components/PageTransition'


import { lazy, Suspense } from 'react'

// ── Standalone pages (no sidebar) ──────────────────────────────────────────
import WelcomePage from '@/pages/WelcomePage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import StudentLoginPage from '@/pages/StudentLoginPage'
import StudentGroupPage from '@/pages/StudentGroupPage'

// ── App pages (wrapped in MainLayout) ──────────────────────────────────────
import MissionBriefing from '@/pages/MissionBriefing'
import TeamMaker from '@/pages/TeamMaker'
import DisasterVideo from '@/pages/DisasterVideo'
import VocabularyLab from '@/pages/VocabularyLab'
import Evaluation from '@/pages/Evaluation'
import ReflectionPage from '@/pages/ReflectionPage'

// ── Lazy-loaded pages ──────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const TutorialIceBreak = lazy(() => import('@/pages/TutorialIceBreak'))
const Simulator = lazy(() => import('@/pages/Simulator'))

function NeobrutalismFallback({ message }: { message: string }) {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-[#FFFEF7] p-8 text-center">
      <div className="space-y-4 border-4 border-[#1A1A2E] bg-white p-8 shadow-[6px_6px_0px_#1A1A2E] max-w-sm w-full">
        <div className="relative mx-auto h-12 w-12 border-4 border-[#1A1A2E] border-t-[#FFE135] animate-spin" />
        <h3 className="text-lg font-black text-[#1A1A2E] uppercase tracking-wider">{message}</h3>
        <p className="text-xs font-bold text-gray-500">Memuat modul halaman...</p>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <CurtainProvider>
      <AuthProvider>
        <BrowserRouter>
          <PageTransition />
          <Routes>
            {/* ── Standalone routes (no MainLayout) ─────────────────── */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/student/login" element={<StudentLoginPage />} />
            <Route path="/student/group" element={<StudentGroupPage />} />

            {/* ── Protected admin route ───────────────────────────── */}
            <Route
              path="/dashboard-guru"
              element={
                <TeacherRoute>
                  <MainLayout>
                    <Suspense fallback={<NeobrutalismFallback message="Dashboard Guru" />}>
                      <AdminDashboard />
                    </Suspense>
                  </MainLayout>
                </TeacherRoute>
              }
            />

            {/* ── App routes (with Sidebar + TopNav) ────────────────── */}
            <Route
              path="/mission"
              element={
                <MainLayout>
                  <MissionBriefing />
                </MainLayout>
              }
            />

            <Route
              path="/mission/:toolId"
              element={
                <MainLayout>
                  <MissionBriefing />
                </MainLayout>
              }
            />

            <Route
              path="/vocabulary"
              element={
                <MainLayout>
                  <VocabularyLab />
                </MainLayout>
              }
            />

            <Route
              path="/simulator"
              element={
                <MainLayout>
                  <Suspense fallback={<NeobrutalismFallback message="Simulator 3D" />}>
                    <Simulator />
                  </Suspense>
                </MainLayout>
              }
            />

            <Route
              path="/evaluation"
              element={
                <MainLayout>
                  <Evaluation />
                </MainLayout>
              }
            />

            <Route
              path="/teammaker"
              element={
                <MainLayout>
                  <TeamMaker />
                </MainLayout>
              }
            />

            <Route
              path="/video"
              element={
                <MainLayout>
                  <DisasterVideo />
                </MainLayout>
              }
            />

            <Route
              path="/tutorial"
              element={
                <MainLayout>
                  <Suspense fallback={<NeobrutalismFallback message="Tutorial & Ice Breaking" />}>
                    <TutorialIceBreak />
                  </Suspense>
                </MainLayout>
              }
            />

            <Route
              path="/reflection"
              element={
                <MainLayout>
                  <ReflectionPage />
                </MainLayout>
              }
            />

            {/* ── 404 fallback ──────────────────────────────────────── */}
            <Route
              path="*"
              element={
                <MainLayout>
                  <div className="flex min-h-full items-center justify-center p-8 text-center">
                    <div className="space-y-3">
                      <p className="text-6xl font-black text-brutal-black">404</p>
                      <h2 className="text-xl font-black text-brutal-black">Halaman Tidak Ditemukan</h2>
                      <p className="text-sm text-gray-500">Rute yang kamu tuju tidak ada.</p>
                    </div>
                  </div>
                </MainLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </CurtainProvider>
  )
}
