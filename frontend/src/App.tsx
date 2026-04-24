import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from 'sonner'

import { GuestRoute, ProtectedRoute } from '@/components/ProtectedRoute'
import LoginPage from '@/pages/Login/Login'
import SignUpPage from '@/pages/SignUp/SignUp'
import { Chat } from '@/pages/Chat/Chat'
import ProfilePage from '@/pages/Profile/Profile'

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position='top-center'
        theme='system'
        toastOptions={{
          style: {
            background: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)'
          }
        }}
      />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignUpPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path='/' element={<Chat />} />
          <Route path='/profile' element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
