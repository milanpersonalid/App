/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AppProvider, useApp } from './context/AppContext';
import { ActiveTab } from './components/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { DesignsView } from './components/views/DesignsView';
import { LotsView } from './components/views/LotsView';
import { ReadyStockView } from './components/views/ReadyStockView';
import { KarigarLedgerView } from './components/views/KarigarLedgerView';

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
import { AdminUsersModal } from './components/AdminUsersModal';

import { AuthAndThemeProvider, useAuthAndTheme } from './context/AuthAndThemeContext';
import { Design, Lot, Stage } from './types';

const StartupSplash: React.FC = () => (
  <div className="flex-1 min-h-0 flex items-center justify-center bg-white">
    <div className="flex flex-col items-center justify-center">
      <img
        src="/shreenathji-logo.png"
        alt="Shreenathji Imitation"
        className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
      />
      <div
        className="mt-5 w-5 h-5 rounded-full border-2 border-[#E07A5F]/30 border-t-[#E07A5F] animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const { designs, lots, isLoading, dataError, refreshData } = useApp();
  const { isLoggedIn, isAuthReady, isAdmin, theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const tabHistoryRef = useRef<ActiveTab[]>(['dashboard']);

  const navigateToTab = useCallback((tab: ActiveTab) => {
    if (activeTab !== tab) tabHistoryRef.current.push(tab);
    setActiveTab(tab);
  }, [activeTab]);

  // Render the simulated phone only on a desktop-sized viewport with a mouse.
  // Real phones/tablets use their own system status and navigation bars.
  const shouldShowDesktopDevicePreview = () =>
    typeof window !== 'undefined' &&
    window.innerWidth > 768 &&
    window.matchMedia('(pointer: fine)').matches;
  const [isFramed, setIsFramed] = useState<boolean>(() => {
    return shouldShowDesktopDevicePreview();
  });

  // Profile and Settings Modals
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAdminUsersOpen, setIsAdminUsersOpen] = useState<boolean>(false);

  // Android Recents Multi-tasking switcher modal
  const [isRecentsOpen, setIsRecentsOpen] = useState<boolean>(false);

  // Modals state
  const [selectedSlipData, setSelectedSlipData] = useState<{
    lot: Lot;
    design: Design;
    initialStage?: Stage;
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

  // Keep the simulated phone frame on desktop only.
  useEffect(() => {
    const handleResize = () => {
      setIsFramed(shouldShowDesktopDevicePreview());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers
  const handleOpenSlip = (lot: Lot, design: Design, initialStage?: Stage) => {
    setSelectedSlipData({ lot, design, initialStage });
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
  const handleAndroidBack = useCallback((): boolean => {
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
    } else if (tabHistoryRef.current.length > 1) {
      tabHistoryRef.current.pop();
      const previousTab = tabHistoryRef.current[tabHistoryRef.current.length - 1] ?? 'dashboard';
      setActiveTab(previousTab);
    } else {
      return false;
    }
    return true;
  }, [
    isSettingsOpen,
    isProfileOpen,
    isRecentsOpen,
    isScannerOpen,
    selectedSlipData,
    selectedStep6Data,
    selectedStep7Lot,
    selectedStageDetail,
    selectedLotDetail,
    isCreateDesignOpen,
    isCreateLotOpen,
  ]);

  // Capacitor intercepts Android hardware Back while this listener is active.
  // Navigate through overlays and visited tabs first; exit only at the root.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let isActive = true;
    let removeListener: (() => void) | undefined;
    void CapacitorApp.addListener('backButton', () => {
      if (!handleAndroidBack()) void CapacitorApp.exitApp();
    }).then((listener) => {
      if (isActive) removeListener = () => void listener.remove();
      else void listener.remove();
    });
    return () => {
      isActive = false;
      removeListener?.();
    };
  }, [handleAndroidBack]);

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
    tabHistoryRef.current = ['dashboard'];
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
      {!isAuthReady ? (
        <StartupSplash />
      ) : !isLoggedIn ? (
        <LoginScreen />
      ) : isLoading ? (
        <StartupSplash />
      ) : dataError ? (
        <div className="flex-1 flex items-center justify-center bg-[#1E1C1A] text-stone-200 px-6 text-center">
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-red-300">Database synchronization failed</p>
            <p className="text-xs text-stone-400 mt-2 break-words">{dataError}</p>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="mt-4 px-4 py-2 rounded-xl bg-[#C5A059] text-stone-950 text-xs font-bold"
            >
              Retry synchronization
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative overflow-x-hidden overflow-y-hidden w-full max-w-full">
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
            className={`flex-1 w-full max-w-full min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar px-3.5 py-4 pb-36 no-print transition-colors duration-200 ${
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

            {activeTab === 'ledger' && <KarigarLedgerView />}
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
            onSelectTab={navigateToTab}
            onOpenScanner={() => handleOpenScannerWithMode('confirm_arrival')}
          />

          {/* Android Recents Task Switcher */}
          <AndroidRecentsModal
            isOpen={isRecentsOpen}
            onClose={() => setIsRecentsOpen(false)}
            onSelectTab={navigateToTab}
            onOpenScanner={() => handleOpenScannerWithMode('confirm_arrival')}
          />
        </div>
      )}

      {/* ALL MODALS (STAGE DETAIL, LOT DETAIL, STEP 6, STEP 7, STAGE SLIP, SCANNER, PROFILE, SETTINGS) */}

      {/* Stage Detail Modal (Base Layer: z-50) */}
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

      {/* Lot Detail Modal (Base Layer: z-50) */}
      {selectedLotDetail && (
        <LotDetailModal
          lot={selectedLotDetail}
          onClose={() => setSelectedLotDetail(null)}
          onOpenSlip={handleOpenSlip}
          onOpenStep6={handleOpenStep6}
          onOpenStep7={handleOpenStep7}
        />
      )}

      {/* Step 6: Manual Data Entry Modal (Action Layer: z-[60]) */}
      {selectedStep6Data && (
        <Step6DataEntryModal
          lot={selectedStep6Data.lot}
          design={selectedStep6Data.design}
          onClose={() => setSelectedStep6Data(null)}
          onSuccess={(updatedLot) => {
            setSelectedStep6Data(null);
            if (selectedLotDetail?.id === updatedLot.id) {
              setSelectedLotDetail(updatedLot);
            }
            // Auto-advance: As soon as "Complete Stage" is clicked, immediately opens the next step to assign the karigar:
            setSelectedStep7Lot(updatedLot);
          }}
        />
      )}

      {/* Step 7: Pick Next Stage Modal (Action Layer: z-[60]) */}
      {selectedStep7Lot && (
        <Step7NextStageModal
          lot={selectedStep7Lot}
          onClose={() => setSelectedStep7Lot(null)}
          onSuccess={(dispatchedLot) => {
            setSelectedStep7Lot(null);
            if (selectedLotDetail?.id === dispatchedLot.id) {
              setSelectedLotDetail(dispatchedLot);
            }
            // Auto-advance: pops open the printed slip for the new stage!
            if (dispatchedLot.status !== 'ready_stock') {
              const d = designs.find((design) => design.id === dispatchedLot.designId);
              if (d) {
                setSelectedSlipData({
                  lot: dispatchedLot,
                  design: d,
                  initialStage: dispatchedLot.currentStage,
                });
              }
            }
          }}
        />
      )}

      {/* Step 1 & Print: Stage Slip Modal (Top Layer: z-[70]) */}
      {selectedSlipData && (
        <StageSlipModal
          lot={selectedSlipData.lot}
          design={selectedSlipData.design}
          initialStage={selectedSlipData.initialStage}
          onClose={() => setSelectedSlipData(null)}
        />
      )}

      {/* 3-Mode Scanner Modal */}
      {isScannerOpen && (
        <ScannerModal
          initialMode={scannerInitialMode}
          onClose={() => setIsScannerOpen(false)}
          onSelectDesign={(design) => {
            navigateToTab('designs');
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
            navigateToTab('designs');
          }}
        />
      )}

      {/* Create Lot Modal */}
      {isCreateLotOpen && (
        <CreateLotModal
          preselectedDesignId={preselectedDesignIdForLot}
          onClose={() => setIsCreateLotOpen(false)}
          onSuccess={(createdLot) => {
            setIsCreateLotOpen(false);
            const design = designs.find((d) => d.id === createdLot.designId);
            if (design && createdLot.status !== 'awaiting_wax_receipt') {
              setSelectedSlipData({ lot: createdLot, design });
            }
            navigateToTab('lots');
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
        onOpenAdmin={() => {
          setIsProfileOpen(false);
          setIsAdminUsersOpen(true);
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

      {isAdmin && (
        <AdminUsersModal
          isOpen={isAdminUsersOpen}
          onClose={() => setIsAdminUsersOpen(false)}
        />
      )}
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
