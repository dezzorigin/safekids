# JAK PLUENG! - Microteaching Portal

This document describes the **current actual state** of the application based on the codebase.

## 1. PROJECT OVERVIEW
**JAK PLUENG!** is an interactive Microteaching Portal designed for English language learning, specifically focusing on "Giving & Following Instructions" in a "Natural Disaster Context" (Earthquake, Flood, Tsunami). 

The application offers two distinct modes:
* **Teacher Mode**: Includes an admin dashboard to manage sessions, a "Spin Wheel" to assign groups, and real-time trackers for student presence, 3D simulation progress, and quiz scores.
* **Student Mode**: Includes a series of interactive learning modules: Concept Maps, YouTube video embeds, an Augmented Reality (AR) vocabulary lab, a 3D Evacuation Simulator, a timed evaluation quiz, and an interactive reflection word cloud.

**Tech Stack:**
* **Core:** React 18, TypeScript, Vite
* **Routing:** React Router DOM
* **Styling:** Tailwind CSS, PostCSS (featuring a highly-customized "Brutalist" design language with hard shadows, bold typography, and bright colors)
* **State Management:** Zustand (for 3D simulation state), React Context (for Auth and Animations)
* **3D Rendering:** React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), Three.js
* **Backend / Database:** Supabase (Auth, Postgres Database, Realtime Broadcast Channels)
* **Animations:** Framer Motion, Vanilla CSS Animations

---

## 2. ROUTING TABLE
Here is the current routing structure defined in `src/App.tsx`:

| Path | Component | Wrapped in MainLayout? | Protected by TeacherRoute? | Standalone page? |
|------|-----------|------------------------|----------------------------|------------------|
| `/` | `WelcomePage` | No | No | Yes |
| `/admin/login` | `AdminLoginPage` | No | No | Yes |
| `/student/login` | `StudentLoginPage` | No | No | Yes |
| `/student/group` | `StudentGroupPage` | No | No | Yes |
| `/admin` | `AdminDashboard` | No | **Yes** | Yes (has custom layout) |
| `/mission` | `MissionBriefing` | **Yes** | No | No |
| `/mission/:toolId` | `MissionBriefing` | **Yes** | No | No |
| `/vocabulary` | `VocabularyLab` | **Yes** | No | No |
| `/simulator` | `Simulator` | **Yes** | No | No |
| `/evaluation` | `Evaluation` | **Yes** | No | No |
| `/teammaker` | `TeamMaker` | **Yes** | No | No |
| `/video` | `DisasterVideo` | **Yes** | No | No |
| `/tutorial` | `TutorialIceBreak` | **Yes** | No | No |
| `/reflection` | `ReflectionPage` | **Yes** | No | No |
| `*` (404) | Fallback 404 UI | **Yes** | No | No |

---

## 3. AUTH FLOW
The current authentication and authorization flow is managed by `AuthContext.tsx`:

* **How AuthContext works:**
  It uses `supabase.auth.getSession()` and listens to `supabase.auth.onAuthStateChange()` to store the current Supabase user session. It exposes `signIn`, `signUp`, and `signOut` methods.
* **What `isTeacher` checks:**
  Evaluated simply as `!!user`. If a valid Supabase authentication session exists, the user is considered a teacher.
* **What `isStudent` checks:**
  Evaluated as `!user && studentGroup !== null`. A student is someone who is *not* logged into Supabase, but *has* a selected group number.
* **How `studentGroup` is stored:**
  Managed within `AuthContext` and persisted in the browser's `sessionStorage` under the key `'studentGroup'`. Helper functions in `src/lib/studentSession.ts` also interact with this storage.
* **What `TeacherRoute` does:**
  A wrapper component (`src/components/layout/TeacherRoute.tsx`) that checks `isTeacher`. If the auth state is still loading, it displays a full-screen "Memuat..." fallback. If `isTeacher` is false, it forces a `<Navigate to="/admin/login" replace />`.

---

## 4. COMPONENT MAP

### Root & Config
* `src/App.tsx` - Main router and context provider setup.
* `src/main.tsx` - React DOM rendering entry point.
* `src/index.css` - Global CSS and Tailwind directives.
* `src/vite-env.d.ts` - Vite environment typings.
* `src/types/index.ts` - Shared TypeScript interfaces (Nav, Mission, Session, Avatar, etc.).
* `src/lib/supabaseClient.ts` - Supabase client initialization.
* `src/lib/studentSession.ts` - Simple session storage utilities.
* `src/store/useSimulationStore.ts` - Zustand store for managing 3D Simulator state (avatar position, commands, traps).

### Context
* `src/context/AuthContext.tsx` - Authentication and student group state provider.
* `src/context/CurtainContext.tsx` - Custom full-screen page transition animations.

### Layout Components
* `src/components/layout/MainLayout.tsx` - Wrapper providing Sidebar and TopNavigation for app routes.
* `src/components/layout/Sidebar.tsx` - Collapsible navigation sidebar (renders differently for teachers vs students).
* `src/components/layout/TopNavigation.tsx` - Header bar for layout.
* `src/components/layout/Drawer.tsx` - Reusable sliding drawer overlay component.
* `src/components/layout/TeacherRoute.tsx` - Route guard for admin access.

### UI Components
* `src/components/ui/Badge.tsx` - Reusable stylized brutalist badge.
* `src/components/ui/Button.tsx` - Reusable stylized brutalist button.
* `src/components/ui/Card.tsx` - Reusable stylized brutalist card.
* `src/components/ui/ConceptMap.tsx` - Embedded SVG used in Welcome and Briefing pages.
* `src/components/ui/InstructionPanel.tsx` - Control panel used in the 3D Simulator to input movement commands.
* `src/components/ui/LoadingSpinner.tsx` - Reusable loading animation.
* `src/components/ui/Modal.tsx` - Reusable modal overlay component.

### 3D Components
* `src/components/3d/MapGrid.tsx` - Generates the 3D grid, obstacles, and goals based on the selected level (Earthquake, Flood, Tsunami).
* `src/components/3d/Avatar.tsx` - The 3D character model rendered in the Simulator.

### Pages
* `src/pages/WelcomePage.tsx` - The landing screen providing role selection.
* `src/pages/AdminLoginPage.tsx` - Teacher login/registration form.
* `src/pages/StudentLoginPage.tsx` - Visual splash/loading sequence before a student picks a group.
* `src/pages/StudentGroupPage.tsx` - Screen where a student selects their group number (1-5).
* `src/pages/AdminDashboard.tsx` - Main teacher view featuring real-time tracking of presence, scores, words, and groups.
* `src/pages/Dashboard.tsx` - Unused/Alternative dashboard component (not mapped in `App.tsx`).
* `src/pages/MissionBriefing.tsx` - Displays the concept map and learning objectives.
* `src/pages/TeamMaker.tsx` - A Canvas-based "Spin Wheel" utility to randomize student groups.
* `src/pages/DisasterVideo.tsx` - Embedded YouTube disaster footage with a custom zoom/overlay feature.
* `src/pages/TutorialIceBreak.tsx` - Placeholder page for tutorial and ice breaker music videos.
* `src/pages/VocabularyLab.tsx` - Page embedding an Assemblr AR studio iframe.
* `src/pages/Simulator.tsx` - The main 3D interactive evacuation simulator using React Three Fiber.
* `src/pages/Evaluation.tsx` - A 5-question multiple choice quiz with a 20-second timer per question.
* `src/pages/ReflectionPage.tsx` - A two-part form (paragraph + single word) that generates a live 2D physics word cloud.

---

## 5. KNOWN ISSUES & PLACEHOLDERS

Based on the actual code, the following items are incomplete, hardcoded, or disconnected:

* **Unconnected Database logic:**
  * In `src/pages/Evaluation.tsx` around line 132, the `saveToSupabase` function is unimplemented. It only contains `// TODO: connect to Supabase` and a `console.log`. Quiz scores are not currently saved to the backend.
* **Placeholder Media / Content:**
  * In `src/pages/TutorialIceBreak.tsx`, both the "Video Tutorial" and "Music Video" cards are hardcoded as placeholders with messages like `"Coming soon — akan diisi video motion graphic"` and `🔒 Video belum tersedia`.
  * In `src/pages/Dashboard.tsx` (the unused dashboard), iframe URLs use placeholders (e.g., `https://view.genial.ly/placeholder`, `https://studio.assemblrworld.com/placeholder`, `https://play.blooket.com/placeholder`).
  * In `src/lib/supabaseClient.ts`, fallbacks for missing environment variables are set to `'https://placeholder.supabase.co'` and `'placeholder'`.
* **Inconsistent/Orphaned Files:**
  * `src/pages/Dashboard.tsx` exists and is fully fleshed out, but it is entirely unused because it is missing from the routing table in `src/App.tsx`. `AdminDashboard.tsx` is the actual dashboard being used.
* **Hardcoded UI Logic:**
  * In `src/pages/AdminLoginPage.tsx`, the email input field defaults its state to `'afif.jakplueng@gmail.com'`.

---

## 6. SUPABASE TABLES & DATA FLOW

The application relies heavily on Supabase for data persistence and real-time features. Based on `AdminDashboard.tsx`, the following tables and channels are utilized:

### Tables
* `sessions`
  * **Fields:** `id`, `teacher_id`, `is_active`, `groups_locked`
  * **Flow:** Created when a teacher logs in. Marks the current active session.
* `groups`
  * **Fields:** `id`, `session_id`, `group_number`, `members` (array of names), `is_locked`
  * **Flow:** Modified by the Teacher in the Admin Dashboard when using the Spin Wheel or locking groups.
* `student_presence`
  * **Fields:** `id`, `session_id`, `group_number`, `current_page`, `last_seen`
  * **Flow:** Updated by students inside `MainLayout.tsx` upon navigation. The Admin Dashboard listens to changes here to show "Siswa Online" and active groups.
* `quiz_results`
  * **Fields:** `id`, `session_id`, `group_number`, `score`, `answers`, `percentage`, `completed_at`
  * **Flow:** Fetched and tracked in real-time by the Admin Dashboard. *(Note: The insert logic on the student's Evaluation page is currently an empty TODO)*.
* `reflections`
  * **Fields:** `id`, `session_id`, `group_number`, `q1_answer`, `q2_word`, `submitted_at`
  * **Flow:** Inserted by students on the Reflection Page. Fetched in real-time by the Admin Dashboard to build the teacher-side Word Cloud.

### Realtime Broadcast Channels
* `admin-presence`, `admin-groups`, `admin-quiz`, `admin-reflections`
  * Subscribe to PostgreSQL `INSERT`, `UPDATE`, and `DELETE` events for live dashboard updates.
* `tracking-channel`
  * Listens to the custom broadcast event `'simulation_update'`. The `Simulator.tsx` sends real-time coordinates (`x`, `z`), `status`, and `last_command` directly over this channel to power the "Live Tracker" panel in the Admin Dashboard.
* `reflection-channel`
  * Listens to custom broadcast event `'word_submit'` to immediately render incoming words into the physics Word Cloud engine without waiting for database persistence.
