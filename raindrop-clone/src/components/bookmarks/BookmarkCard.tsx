'use client';

import React from 'react';
import { Star, ExternalLink, MoreHorizontal, Trash2, RotateCcw, X } from 'lucide-react';
import { useAppStore } from '@/store/StoreContext';
import { Bookmark, ViewMode } from '@/types';
import { getDomain, formatDate } from '@/utils/metadata';

interface BookmarkCardProps {
  bookmark: Bookmark;
  viewMode: ViewMode;
}

export default function BookmarkCard({ bookmark, viewMode }: BookmarkCardProps) {
  const {
    toggleStarred, deleteBookmark, restoreBookmark, permanentlyDeleteBookmark,
    setSelectedBookmarkId, selectedBookmarkId, activeView
  } = useAppStore();

  const [showMenu, setShowMenu] = React.useState(false);
  const isSelected = selectedBookmarkId === bookmark.id;
  const isTrash = activeView.type === 'trash';

  const handleClick = () => {
    setSelectedBookmarkId(isSelected ? null : bookmark.id);
  };

  const openUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  if (viewMode === 'headlines') {
    return (
      <div
        onClick={handleClick}
        className={`flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        {bookmark.favicon && (
          <img src={bookmark.favicon} alt="" className="w-4 h-4 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">{bookmark.title}</span>
        <span className="text-xs text-gray-400 shrink-0">{getDomain(bookmark.url)}</span>
        {bookmark.starred && <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />}
        <span className="text-xs text-gray-400 shrink-0">{formatDate(bookmark.created)}</span>
      </div>
    );
  }

  if (viewMode === 'grid' || viewMode === 'masonry') {
    return (
      <div
        onClick={handleClick}
        className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900/30'
            : 'border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {/* Cover image area */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800" style={{ height: viewMode === 'masonry' ? `${120 + (bookmark.title.length % 5) * 20}px` : '140px' }}>
          {bookmark.cover ? (
            <img src={bookmark.cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {bookmark.favicon ? (
                <img src={bookmark.favicon} alt="" className="w-8 h-8 opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <ExternalLink size={24} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
            {!isTrash && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleStarred(bookmark.id); }}
                className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800"
              >
                <Star size={14} className={bookmark.starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); openUrl(e); }}
              className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800"
            >
              <ExternalLink size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start gap-2">
            {bookmark.favicon && (
              <img src={bookmark.favicon} alt="" className="w-4 h-4 mt-0.5 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                {bookmark.title}
              </h3>
              {bookmark.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{bookmark.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">{getDomain(bookmark.url)}</span>
            {bookmark.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {bookmark.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      {/* Favicon */}
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
        {bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <ExternalLink size={14} className="text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{bookmark.title}</h3>
          {bookmark.starred && <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 truncate">{getDomain(bookmark.url)}</span>
          {bookmark.description && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-400 truncate">{bookmark.description}</span>
            </>
          )}
        </div>
        {bookmark.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {bookmark.tags.map(tag => (
              <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Meta & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400">{formatDate(bookmark.created)}</span>

        <div className="hidden group-hover:flex items-center gap-1">
          {isTrash ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); restoreBookmark(bookmark.id); }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-green-600"
                title="Restore"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); permanentlyDeleteBookmark(bookmark.id); }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600"
                title="Delete permanently"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); toggleStarred(bookmark.id); }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                title="Toggle star"
              >
                <Star size={14} className={bookmark.starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
              </button>
              <button
                onClick={openUrl}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600"
                title="Open link"
              >
                <ExternalLink size={14} />
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400"
                >
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                        Move to Trash
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
