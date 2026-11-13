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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#242424] text-zinc-900 select-none">
      {/* Top Header with App Launcher and Persona Switcher */}
      <TopHeader />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Navigation Rail */}
        <NavigationRail />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex overflow-hidden">
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
                currentUser.role === 'admin' ? (
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

const AppRouter: React.FC = () => {
  const { viewMode } = useApp();
  return viewMode === 'portal' ? <PortalLanding /> : <MainWorkspace />;
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <GlobalDialogModal />
    </AppProvider>
  );
}
