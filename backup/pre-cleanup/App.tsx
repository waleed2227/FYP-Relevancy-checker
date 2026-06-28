import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Registration from './components/Registration';
import StudentDashboard from './components/StudentDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import IdeaSubmissionForm from './components/IdeaSubmissionForm';
import RelevancyResults from './components/RelevancyResults';
import ProfileEdit from './components/ProfileEdit';
import MyProjects from './components/MyProjects';
import AISuggestions from './components/AISuggestions';
import ReviewQueue from './components/ReviewQueue';
import AllProjects from './components/AllProjects';
import Notifications from './components/Notifications';
import AIAnalytics from './components/AIAnalytics';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminStudents from './components/AdminStudents';
import AdminProfessors from './components/AdminProfessors';
import AdminDepartments from './components/AdminDepartments';
import AdminAIReports from './components/AdminAIReports';
import AdminProjects from './components/AdminProjects';
import AdminApprovals from './components/AdminApprovals';
import AdminAnalytics from './components/AdminAnalytics';
import AdminSettings from './components/AdminSettings';

type UserRole = 'student' | 'professor' | 'admin' | null;
type Screen =
  | 'login'
  | 'registration'
  | 'dashboard'
  | 'submit-idea'
  | 'relevancy-results'
  | 'profile'
  | 'my-projects'
  | 'ai-suggestions'
  | 'review-queue'
  | 'all-projects'
  | 'ai-analytics'
  | 'notifications'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-students'
  | 'admin-professors'
  | 'admin-departments'
  | 'admin-projects'
  | 'admin-ai-reports'
  | 'admin-approvals'
  | 'admin-analytics'
  | 'admin-settings';

function AppContent() {
  const { userRole, isAuthenticated, login, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    // Load saved screen from localStorage or default based on role
    const savedScreen = localStorage.getItem('currentScreen') as Screen;
    if (savedScreen && isAuthenticated) return savedScreen;
    if (userRole === 'admin') return 'admin-dashboard';
    if (userRole) return 'dashboard';
    return 'login';
  });
  const [selectedIdea, setSelectedIdea] = useState<any>(null);

  // Persist current screen to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('currentScreen', currentScreen);
    }
  }, [currentScreen, isAuthenticated]);

  // Update screen when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentScreen('login');
    } else {
      const savedScreen = localStorage.getItem('currentScreen') as Screen;
      if (!savedScreen) {
        if (userRole === 'admin') {
          setCurrentScreen('admin-dashboard');
        } else {
          setCurrentScreen('dashboard');
        }
      }
    }
  }, [isAuthenticated, userRole]);

  const handleLogin = (role: 'student' | 'professor' | 'admin') => {
    login(role);
    if (role === 'admin') {
      setCurrentScreen('admin-dashboard');
    } else {
      setCurrentScreen('dashboard');
    }
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

  const handleProfileClick = () => {
    setCurrentScreen('profile');
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
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
        />
      );
    }

    if (currentScreen === 'relevancy-results' && userRole === 'student' && selectedIdea) {
      return (
        <RelevancyResults
          idea={selectedIdea}
          onBackToDashboard={handleBackToDashboard}
        />
      );
    }

    if (currentScreen === 'profile' && userRole) {
      return (
        <ProfileEdit
          role={userRole}
          onLogout={handleLogout}
          onBack={handleBackToDashboard}
          onNavigate={handleNavigate}
        />
      );
    }

    // Student screens
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
        case 'ai-suggestions':
          return <AISuggestions onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications role="student" onLogout={handleLogout} onNavigate={handleNavigate} />;
        default:
          break;
      }
    }

    // Professor screens
    if (userRole === 'professor') {
      switch (currentScreen) {
        case 'dashboard':
          return <ProfessorDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'review-queue':
          return <ReviewQueue onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'all-projects':
          return <AllProjects onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'ai-analytics':
          return <AIAnalytics onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications role="professor" onLogout={handleLogout} onNavigate={handleNavigate} />;
        default:
          break;
      }
    }

    // Admin screens
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
        case 'admin-departments':
          return <AdminDepartments onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-projects':
          return <AdminProjects onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-ai-reports':
          return <AdminAIReports onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-approvals':
          return <AdminApprovals onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-analytics':
          return <AdminAnalytics onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'admin-settings':
          return <AdminSettings onLogout={handleLogout} onNavigate={handleNavigate} />;
        case 'notifications':
          return <Notifications role="professor" onLogout={handleLogout} onNavigate={handleNavigate} />;
        default:
          return <AdminDashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
      }
    }

    if (currentScreen === 'dashboard') {
      return <Login onLogin={handleLogin} onRegister={handleShowRegistration} />;
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