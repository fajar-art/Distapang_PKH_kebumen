'use client';

import React, { forwardRef } from 'react';
import { SubmenuItem } from './types';
import { SubmenuPageSkeleton } from '@/components/common/Skeleton';

interface IframeViewerProps {
  isDark: boolean;
  activeSubmenu: SubmenuItem;
  isIframeLoading: boolean;
  onIframeLoad: () => void;
  refreshKey?: number;
}

const IframeViewer = forwardRef<HTMLIFrameElement, IframeViewerProps>(
  ({ isDark, activeSubmenu, isIframeLoading, onIframeLoad, refreshKey = 0 }, ref) => {
    return (
      <div className="flex-1 flex flex-col relative w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Modern Skeleton loading overlay for iframe */}
        {isIframeLoading && (
          <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
            <SubmenuPageSkeleton
              title={`Memuat Menu ${activeSubmenu.name}...`}
              isDark={isDark}
            />
          </div>
        )}

        {/* Seamless Embedded View with dynamic key to ensure clean mount on route change */}
        <iframe
          key={`${activeSubmenu.id}-${refreshKey}`}
          ref={ref}
          src={activeSubmenu.href}
          onLoad={onIframeLoad}
          allow="geolocation *; camera *; microphone *; clipboard-read *; clipboard-write *"
          className={`w-full h-full border-0 flex-1 ${isDark ? 'bg-slate-950' : 'bg-white'}`}
          title={activeSubmenu.name}
        />
      </div>
    );
  }
);

IframeViewer.displayName = 'IframeViewer';

export default IframeViewer;
