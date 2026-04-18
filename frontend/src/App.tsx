import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'sonner';

import { GuestRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import LoginPage from '@/pages/Login/Login';
import SignUpPage from '@/pages/SignUp/SignUp';
import HomePage from '@/pages/Home/Home';

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
            color: 'var(--foreground)',
          },
        }}
      />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignUpPage />} />
        </Route>
        <Route path='/' element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
