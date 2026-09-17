/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ActiveTab } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { DesignsView } from './components/views/DesignsView';
import { LotsView } from './components/views/LotsView';
import { ReadyStockView } from './components/views/ReadyStockView';

// Android Framework Components
import { AndroidDeviceFrame } from './components/android/AndroidDeviceFrame';
import { AndroidTopAppBar } from './components/android/AndroidTopAppBar';
import { AndroidBottomNav } from './components/android/AndroidBottomNav';
import { AndroidQuickFab } from './components/android/AndroidQuickFab';
import { AndroidRecentsModal } from './components/android/AndroidRecentsModal';

// Modals
import { StageSlipModal } from './components/StageSlipModal';
import { Step6DataEntryModal } from './components/Step6DataEntryModal';
import { Step7NextStageModal } from './components/Step7NextStageModal';
import { ScannerModal } from './components/ScannerModal';
import { StageDetailModal } from './components/StageDetailModal';
import { CreateDesignModal } from './components/CreateDesignModal';
import { CreateLotModal } from './components/CreateLotModal';
import { LotDetailModal } from './components/LotDetailModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';

import { AuthAndThemeProvider, useAuthAndTheme } from './context/AuthAndThemeContext';
import { Design, Lot, Stage } from './types';

const MainApp: React.FC = () => {
  const { designs, lots } = useApp();
  const { isLoggedIn, theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Device frame toggle (on desktop screens, defaults to true so it looks like an authentic Android smartphone)
  const [isFramed, setIsFramed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return false;
  });

  // Profile and Settings Modals
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Android Recents Multi-tasking switcher modal
  const [isRecentsOpen, setIsRecentsOpen] = useState<boolean>(false);

  // Modals state
  const [selectedSlipData, setSelectedSlipData] = useState<{
    lot: Lot;
    design: Design;
  } | null>(null);

  const [selectedStep6Data, setSelectedStep6Data] = useState<{
    lot: Lot;
    design: Design;
  } | null>(null);

  const [selectedStep7Lot, setSelectedStep7Lot] = useState<Lot | null>(null);
  const [selectedStageDetail, setSelectedStageDetail] = useState<Stage | null>(null);
  const [selectedLotDetail, setSelectedLotDetail] = useState<Lot | null>(null);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<
    'confirm_arrival' | 'look_up' | 'photo_search'
  >('confirm_arrival');

  // Creation modals
  const [isCreateDesignOpen, setIsCreateDesignOpen] = useState<boolean>(false);
  const [isCreateLotOpen, setIsCreateLotOpen] = useState<boolean>(false);
  const [preselectedDesignIdForLot, setPreselectedDesignIdForLot] = useState<string | undefined>(
    undefined
  );

  // Auto-adapt on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsFramed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers
  const handleOpenSlip = (lot: Lot, design: Design) => {
    setSelectedSlipData({ lot, design });
  };

  const handleOpenStep6 = (lot: Lot, design: Design) => {
    setSelectedStep6Data({ lot, design });
  };

  const handleOpenStep7 = (lot: Lot) => {
    setSelectedStep7Lot(lot);
  };

  const handleOpenLot = (lot: Lot) => {
    setSelectedLotDetail(lot);
  };

  const handleOpenScannerWithMode = (
    mode: 'confirm_arrival' | 'look_up' | 'photo_search'
  ) => {
    setScannerInitialMode(mode);
    setIsScannerOpen(true);
  };

  const handleOpenCreateLotWithDesign = (designId: string) => {
    setPreselectedDesignIdForLot(designId);
    setIsCreateLotOpen(true);
  };

  // Android System Navigation Key Actions
  const handleAndroidBack = () => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      setIsProfileOpen(true);
    } else if (isProfileOpen) {
      setIsProfileOpen(false);
    } else if (isRecentsOpen) {
      setIsRecentsOpen(false);
    } else if (isScannerOpen) {
      setIsScannerOpen(false);
    } else if (selectedSlipData) {
      setSelectedSlipData(null);
    } else if (selectedStep6Data) {
      setSelectedStep6Data(null);
    } else if (selectedStep7Lot) {
      setSelectedStep7Lot(null);
    } else if (selectedStageDetail) {
      setSelectedStageDetail(null);
    } else if (selectedLotDetail) {
      setSelectedLotDetail(null);
    } else if (isCreateDesignOpen) {
      setIsCreateDesignOpen(false);
    } else if (isCreateLotOpen) {
      setIsCreateLotOpen(false);
    } else if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const handleAndroidHome = () => {
    // Return to dashboard and close all overlays
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
    setIsRecentsOpen(false);
    setIsScannerOpen(false);
    setSelectedSlipData(null);
    setSelectedStep6Data(null);
    setSelectedStep7Lot(null);
    setSelectedStageDetail(null);
    setSelectedLotDetail(null);
    setIsCreateDesignOpen(false);
    setIsCreateLotOpen(false);
    setActiveTab('dashboard');
  };

  const handleAndroidRecents = () => {
    setIsRecentsOpen(true);
  };

  return (
    <AndroidDeviceFrame
      isFramed={isFramed}
      onToggleFrame={() => setIsFramed(!isFramed)}
      onBack={handleAndroidBack}
      onHome={handleAndroidHome}
      onRecents={handleAndroidRecents}
    >
      {!isLoggedIn ? (
        <LoginScreen />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden w-full">
          {/* Android Top App Bar with Profile and quick actions */}
          <AndroidTopAppBar
            onOpenScanner={() => handleOpenScannerWithMode('confirm_arrival')}
            onOpenCreateDesign={() => setIsCreateDesignOpen(true)}
            onOpenCreateLot={() => {
              setPreselectedDesignIdForLot(undefined);
              setIsCreateLotOpen(true);
            }}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Main Android App Screen Content */}
          <div
            className={`flex-1 w-full min-h-0 overflow-y-auto px-3.5 py-4 pb-36 no-print transition-colors duration-200 ${
              isBright ? 'bg-[#FAF7F2]' : 'bg-[#1E1C1A]'
            }`}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                onSelectStage={(stage) => setSelectedStageDetail(stage)}
                onOpenStep6={handleOpenStep6}
                onOpenStep7={handleOpenStep7}
                onOpenSlip={handleOpenSlip}
                onOpenLot={handleOpenLot}
                onOpenScannerConfirm={() => handleOpenScannerWithMode('confirm_arrival')}
              />
            )}

            {activeTab === 'designs' && (
              <DesignsView
                onOpenCreateDesign={() => setIsCreateDesignOpen(true)}
                onOpenCreateLotWithDesign={handleOpenCreateLotWithDesign}
              />
            )}

            {activeTab === 'lots' && (
              <LotsView
                onOpenCreateLot={() => {
                  setPreselectedDesignIdForLot(undefined);
                  setIsCreateLotOpen(true);
                }}
                onOpenSlip={handleOpenSlip}
                onOpenStep6={handleOpenStep6}
                onOpenStep7={handleOpenStep7}
                onOpenLot={handleOpenLot}
              />
            )}

            {activeTab === 'ready_stock' && (
              <ReadyStockView onOpenLot={handleOpenLot} />
            )}
          </div>

          {/* Android Floating Quick Action Buttons */}
          <AndroidQuickFab
            onOpenScanner={() => handleOpenScannerWithMode('confirm_arrival')}
            onOpenCreateLot={() => {
              setPreselectedDesignIdForLot(undefined);
              setIsCreateLotOpen(true);
            }}
          />

          {/* Android Material 3 Bottom Navigation Bar */}
          <AndroidBottomNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenScanner={() => handleOpenScannerWithMode('confirm_arrival')}
          />

          {/* Android Recents Task Switcher */}
          <AndroidRecentsModal
            isOpen={isRecentsOpen}
            onClose={() => setIsRecentsOpen(false)}
            onSelectTab={setActiveTab}
            onOpenScanner={() => handleOpenScannerWithMode('confirm_arrival')}
          />
        </div>
      )}

      {/* ALL MODALS (SLIP, DATA ENTRY, NEXT STAGE, DETAIL, SCANNER, PROFILE, SETTINGS) */}

      {/* Step 1: Stage Slip Modal (Printable) */}
      {selectedSlipData && (
        <StageSlipModal
          lot={selectedSlipData.lot}
          design={selectedSlipData.design}
          onClose={() => setSelectedSlipData(null)}
        />
      )}

      {/* Step 6: Manual Data Entry Modal */}
      {selectedStep6Data && (
        <Step6DataEntryModal
          lot={selectedStep6Data.lot}
          design={selectedStep6Data.design}
          onClose={() => setSelectedStep6Data(null)}
          onSuccess={() => {
            setSelectedStep6Data(null);
            if (selectedLotDetail?.id === selectedStep6Data.lot.id) {
              const updated = lots.find((l) => l.id === selectedStep6Data.lot.id);
              if (updated) setSelectedLotDetail(updated);
            }
          }}
        />
      )}

      {/* Step 7: Pick Next Stage Modal */}
      {selectedStep7Lot && (
        <Step7NextStageModal
          lot={selectedStep7Lot}
          onClose={() => setSelectedStep7Lot(null)}
          onSuccess={() => {
            const updated = lots.find((l) => l.id === selectedStep7Lot.id);
            setSelectedStep7Lot(null);
            if (updated) {
              const d = designs.find((design) => design.id === updated.designId);
              if (d && updated.status !== 'ready_stock') {
                setSelectedSlipData({ lot: updated, design: d });
              }
            }
          }}
        />
      )}

      {/* Stage Detail Modal */}
      {selectedStageDetail && (
        <StageDetailModal
          stage={selectedStageDetail}
          onClose={() => setSelectedStageDetail(null)}
          onOpenSlip={handleOpenSlip}
          onOpenStep6={handleOpenStep6}
          onOpenStep7={handleOpenStep7}
          onOpenLot={handleOpenLot}
        />
      )}

      {/* Lot Detail Modal */}
      {selectedLotDetail && (
        <LotDetailModal
          lot={selectedLotDetail}
          onClose={() => setSelectedLotDetail(null)}
          onOpenSlip={handleOpenSlip}
          onOpenStep6={handleOpenStep6}
          onOpenStep7={handleOpenStep7}
        />
      )}

      {/* 3-Mode Scanner Modal */}
      {isScannerOpen && (
        <ScannerModal
          initialMode={scannerInitialMode}
          onClose={() => setIsScannerOpen(false)}
          onSelectDesign={(design) => {
            setActiveTab('designs');
          }}
          onSelectLot={(lot) => {
            setSelectedLotDetail(lot);
          }}
        />
      )}

      {/* Create Design Modal */}
      {isCreateDesignOpen && (
        <CreateDesignModal
          onClose={() => setIsCreateDesignOpen(false)}
          onSuccess={() => {
            setIsCreateDesignOpen(false);
            setActiveTab('designs');
          }}
        />
      )}

      {/* Create Lot Modal */}
      {isCreateLotOpen && (
        <CreateLotModal
          preselectedDesignId={preselectedDesignIdForLot}
          onClose={() => setIsCreateLotOpen(false)}
          onSuccess={(lotNumber) => {
            setIsCreateLotOpen(false);
            const createdLot = lots.find((l) => l.lotNumber === lotNumber);
            if (createdLot) {
              const design = designs.find((d) => d.id === createdLot.designId);
              if (design) {
                setSelectedSlipData({ lot: createdLot, design });
              }
            }
            setActiveTab('lots');
          }}
        />
      )}

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenSettings={() => {
          setIsProfileOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* App Settings Modal (Dark & Bright Mode Toggle, Audio, Feedback) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onBackToProfile={() => {
          setIsSettingsOpen(false);
          setIsProfileOpen(true);
        }}
      />
    </AndroidDeviceFrame>
  );
};

export default function App() {
  return (
    <AuthAndThemeProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthAndThemeProvider>
  );
}
