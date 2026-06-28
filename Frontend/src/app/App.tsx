import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { resolveScreenForRole } from './navigation';
import Login from './components/Login';
import Registration from './components/Registration';
import StudentDashboard from './components/StudentDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import IdeaSubmissionForm from './components/IdeaSubmissionForm';
import RelevancyResults from './components/RelevancyResults';
import ProfileEdit from './components/ProfileEdit';
import MyProjects from './components/MyProjects';
import ReviewQueue from './components/ReviewQueue';
import Notifications from './components/Notifications';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminStudents from './components/AdminStudents';
import AdminProfessors from './components/AdminProfessors';
import AdminProjects from './components/AdminProjects';

type UserRole = 'student' | 'professor' | 'admin' | null;
type Screen =
  | 'login'
  | 'registration'
  | 'dashboard'
  | 'submit-idea'
  | 'relevancy-results'
  | 'profile'
  | 'my-projects'
  | 'review-queue'
  | 'notifications'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-students'
  | 'admin-professors'
  | 'admin-projects';

function AppContent() {
  const { userRole, isAuthenticated, login, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const savedScreen = localStorage.getItem('currentScreen');
    if (savedScreen && isAuthenticated) {
      return resolveScreenForRole(savedScreen, userRole) as Screen;
    }
    if (userRole === 'admin') return 'admin-dashboard';
    if (userRole) return 'dashboard';
    return 'login';
  });
  const [selectedIdea, setSelectedIdea] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('currentScreen', currentScreen);
    }
  }, [currentScreen, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentScreen('login');
    } else {
      const savedScreen = localStorage.getItem('currentScreen');
      const resolved = resolveScreenForRole(savedScreen, userRole) as Screen;
      if (resolved !== savedScreen) {
        setCurrentScreen(resolved);
      } else if (!savedScreen) {
        setCurrentScreen(userRole === 'admin' ? 'admin-dashboard' : 'dashboard');
      }
    }
  }, [isAuthenticated, userRole]);

  const handleLogin = (role: 'student' | 'professor' | 'admin') => {
    login(role);
    setCurrentScreen(role === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const handleRegister = (role: 'student' | 'professor') => {
    login(role);
    setCurrentScreen('dashboard');
  };

  const handleShowRegistration = () => {
    setCurrentScreen('registration');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentScreen('login');
    setSelectedIdea(null);
    localStorage.removeItem('currentScreen');
  };

  const handleSubmitIdea = () => {
    setCurrentScreen('submit-idea');
  };

  const handleIdeaSubmitted = (idea: any) => {
    setSelectedIdea(idea);
    setCurrentScreen('relevancy-results');
  };

  const handleBackToDashboard = () => {
    if (userRole === 'admin') {
      setCurrentScreen('admin-dashboard');
    } else {
      setCurrentScreen('dashboard');
    }
    setSelectedIdea(null);
  };

  const handleNavigate = (screen: string) => {
    const resolved = resolveScreenForRole(screen, userRole) as Screen;
    setCurrentScreen(resolved);
  };

  const renderContent = () => {
    if (currentScreen === 'login') {
      return <Login onLogin={handleLogin} onRegister={handleShowRegistration} />;
    }

    if (currentScreen === 'registration') {
      return <Registration onRegister={handleRegister} onBackToLogin={handleBackToLogin} />;
    }

    if (currentScreen === 'submit-idea' && userRole === 'student') {
      return (
        <IdeaSubmissionForm
          onSubmit={handleIdeaSubmitted}
          onCancel={handleBackToDashboard}
          onLogout={handleLogout}
        />
      );
    }

    if (currentScreen === 'relevancy-results' && userRole === 'student' && selectedIdea) {
      return (
        <RelevancyResults
          idea={selectedIdea}
          onBackToDashboard={handleBackToDashboard}
          onLogout={handleLogout}
        />
      );
    }

    if (currentScreen === 'profile' && (userRole === 'student' || userRole === 'professor')) {
      return (
        <ProfileEdit
          role={userRole}
          onLogout={handleLogout}
          onBack={handleBackToDashboard}
          onNavigate={handleNavigate}
        />
      );
    }

    if (userRole === 'student') {
      switch (currentScreen) {
        case 'dashboard':
          return (
            <StudentDashboard
              onSubmitIdea={handleSubmitIdea}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          );
        case 'my-projects':
          return <MyProjects onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications role="student" onLogout={handleLogout} onNavigate={handleNavigate} />;
        default:
          return (
            <StudentDashboard
              onSubmitIdea={handleSubmitIdea}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          );
      }
    }

    if (userRole === 'professor') {
      switch (currentScreen) {
        case 'dashboard':
          return <ProfessorDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'review-queue':
          return <ReviewQueue onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications role="professor" onLogout={handleLogout} onNavigate={handleNavigate} />;
        default:
          return <ProfessorDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
      }
    }

    if (userRole === 'admin') {
      switch (currentScreen) {
        case 'admin-dashboard':
          return <AdminDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-users':
          return <AdminUsers onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-students':
          return <AdminStudents onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-professors':
          return <AdminProfessors onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-projects':
          return <AdminProjects onLogout={handleLogout} onNavigate={handleNavigate} />;
        default:
          return <AdminDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
      }
    }

    return <Login onLogin={handleLogin} onRegister={handleShowRegistration} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {renderContent()}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
