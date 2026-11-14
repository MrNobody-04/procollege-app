import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationRail } from './components/NavigationRail';
import { TopHeader } from './components/TopHeader';
import { TeamsSidebar } from './components/TeamsSidebar';
import { ChannelView } from './components/ChannelView';
import { ChatView } from './components/ChatView';
import { AssignmentsView } from './components/AssignmentsView';
import { CalendarView } from './components/CalendarView';
import { FilesView } from './components/FilesView';
import { ActivityView } from './components/ActivityView';
import { AdminCenterView } from './components/AdminCenterView';
import { MeetingModal } from './components/MeetingModal';
import { PortalLanding } from './components/PortalLanding';
import { GlobalDialogModal } from './components/GlobalDialogModal';

const MainWorkspace: React.FC = () => {
  const { activeTab, currentUser } = useApp();
  const isPlatformDev = currentUser.role === 'developer' || currentUser.role === 'platform_admin';

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden overflow-y-hidden bg-[#141E2B] text-zinc-900 select-none">
      {/* Top Header with App Launcher and Persona Switcher */}
      <TopHeader />

      {/* Main App Workspace */}
      <div className="flex-1 flex w-full max-w-full overflow-hidden">
        {/* Leftmost Navigation Rail */}
        <NavigationRail />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex w-full max-w-full overflow-hidden min-w-0">
          {isPlatformDev ? (
            <AdminCenterView activeDevTab={activeTab} />
          ) : (
            <>
              {activeTab === 'teams' && (
                <>
                  <TeamsSidebar />
                  <ChannelView />
                </>
              )}

              {activeTab === 'chat' && <ChatView />}

              {activeTab === 'assignments' && <AssignmentsView />}

              {activeTab === 'calendar' && <CalendarView />}

              {activeTab === 'files' && <FilesView />}

              {activeTab === 'activity' && <ActivityView />}

              {activeTab === 'admin' && (
                (currentUser.role === 'admin' || currentUser.role === 'assistant_admin') ? (
                  <AdminCenterView />
                ) : (
                  <>
                    <TeamsSidebar />
                    <ChannelView />
                  </>
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* Interactive WebRTC Classroom Modal */}
      <MeetingModal />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProCollege Workspace ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#1e1e1e] text-white p-6 select-none">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Workspace Session Alert</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected display issue occurred in this session. Resetting the session will restore your environment.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-zinc-500 bg-black/40 p-2.5 rounded border border-zinc-800 break-words text-left">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('procollege_token');
                    localStorage.removeItem('procollege_user');
                    localStorage.removeItem('procollege_college');
                  } catch {}
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Reset &amp; Reload Portal
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRouter: React.FC = () => {
  const { viewMode } = useApp();
  return viewMode === 'portal' ? <PortalLanding /> : <MainWorkspace />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRouter />
        <GlobalDialogModal />
      </AppProvider>
    </ErrorBoundary>
  );
}
