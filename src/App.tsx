import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthForms } from './components/AuthForms';
import { Dashboard } from './components/Dashboard';
import { UpgradeModal } from './components/UpgradeModal';
import useAuth from './hooks/useAuth';

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    return <AuthForms onSignIn={signIn} onSignUp={signUp} />;
  }

  return (
    <>
      <Dashboard
        user={user}
        onSignOut={signOut}
        onUpgradeToPro={() => setShowUpgradeModal(true)}
      />
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </>
  );
}

export default App;
