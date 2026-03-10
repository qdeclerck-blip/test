'use client';

import React from 'react';
import { Inbox, Bookmark as BookmarkIcon } from 'lucide-react';
import { useAppStore } from '@/store/StoreContext';
import BookmarkCard from './BookmarkCard';

export default function BookmarkList() {
  const { getFilteredBookmarks, viewMode, activeView } = useAppStore();
  const bookmarks = getFilteredBookmarks();

  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-20">
        {activeView.type === 'trash' ? (
          <>
            <Inbox size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">Trash is empty</p>
            <p className="text-sm mt-1">Deleted bookmarks will appear here</p>
          </>
        ) : (
          <>
            <BookmarkIcon size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No bookmarks yet</p>
            <p className="text-sm mt-1">Click the + Add button to save your first bookmark</p>
          </>
        )}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {bookmarks.map(bookmark => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} viewMode={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'masonry') {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
          {bookmarks.map(bookmark => (
            <div key={bookmark.id} className="mb-4 break-inside-avoid">
              <BookmarkCard bookmark={bookmark} viewMode={viewMode} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List and Headlines views
  return (
    <div className="flex-1 overflow-y-auto">
      {bookmarks.map(bookmark => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} viewMode={viewMode} />
      ))}
    </div>
  );
}
