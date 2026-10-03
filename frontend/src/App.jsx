import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Toaster } from './components/composite/Toast';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ModulesProvider } from './features/settings/context/ModulesContext';
import InstallPwaPrompt from './components/pwa/InstallPwaPrompt';

function App() {
  return (
    <AuthProvider>
      <ModulesProvider>
        <RouterProvider router={router} />
        <Toaster />
        <InstallPwaPrompt />
      </ModulesProvider>
    </AuthProvider>
  );
}

export default App;
