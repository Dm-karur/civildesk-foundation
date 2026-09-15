import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Toaster } from './components/composite/Toast';
import { AuthProvider } from './features/auth/context/AuthContext';
import InstallPwaPrompt from './components/pwa/InstallPwaPrompt';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
      <InstallPwaPrompt />
    </AuthProvider>
  );
}

export default App;
