import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthForms } from './components/AuthForms';
import { Dashboard } from './components/Dashboard';
import { UpgradeModal } from './components/UpgradeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import useAuth from './hooks/useAuth';

function App() {
  const { user, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!user ? (
        showLanding ? (
          <LandingPage onGetStarted={() => setShowLanding(false)} />
        ) : (
          <AuthForms
            onSignIn={signIn}
            onSignUp={signUp}
            onGoogleSignIn={signInWithGoogle}
          />
        )
      ) : (
        <>
          <Dashboard
            user={user}
            onSignOut={signOut}
            onUpgradeToPro={() => setShowUpgradeModal(true)}
          />
          {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
        </>
      )}
    </ErrorBoundary>
  );
}

export default App;
