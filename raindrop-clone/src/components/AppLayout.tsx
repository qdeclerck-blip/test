'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/StoreContext';
import Sidebar from './sidebar/Sidebar';
import Toolbar from './bookmarks/Toolbar';
import BookmarkList from './bookmarks/BookmarkList';
import BookmarkDetail from './bookmarks/BookmarkDetail';
import AddBookmarkModal from './modals/AddBookmarkModal';
import { Cloud, Sun, Moon } from 'lucide-react';

export default function AppLayout() {
  const { sidebarWidth, setSidebarWidth, selectedBookmarkId, isLoaded } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dragRef = useRef<number>(0);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K = search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = e.clientX;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(450, sidebarWidth + (e.clientX - dragRef.current)));
      setSidebarWidth(newWidth);
      dragRef.current = e.clientX;
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sidebarWidth, setSidebarWidth]);

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <Cloud size={48} className="text-blue-500 animate-pulse" />
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div style={{ width: sidebarWidth }} className="shrink-0 relative">
        <Sidebar />
        {/* Dark mode toggle at bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Cloud size={14} className="text-blue-500" />
            <span className="font-medium">RainDrop Clone</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize hover:bg-blue-400 transition-colors shrink-0 ${isDragging ? 'bg-blue-400' : 'bg-transparent'}`}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar onAddBookmark={() => setShowAddModal(true)} />
        <div className="flex-1 flex overflow-hidden">
          <BookmarkList />
          {selectedBookmarkId && <BookmarkDetail />}
        </div>
      </div>

      {/* Add Bookmark Modal */}
      <AddBookmarkModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
