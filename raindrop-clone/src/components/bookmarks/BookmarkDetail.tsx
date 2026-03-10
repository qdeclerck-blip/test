'use client';

import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, Star, Trash2, Tag, FolderOpen,
  FileText, Clock, Globe, Edit3, Save
} from 'lucide-react';
import { useAppStore } from '@/store/StoreContext';
import { getDomain, formatDate } from '@/utils/metadata';

export default function BookmarkDetail() {
  const {
    bookmarks, selectedBookmarkId, setSelectedBookmarkId,
    updateBookmark, deleteBookmark, toggleStarred, collections
  } = useAppStore();

  const bookmark = bookmarks.find(b => b.id === selectedBookmarkId);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (bookmark) {
      setNoteText(bookmark.note);
      setIsEditingNote(false);
      setIsEditingTags(false);
    }
  }, [bookmark]);

  if (!bookmark) return null;

  const collection = bookmark.collectionId
    ? collections.find(c => c.id === bookmark.collectionId)
    : null;

  const handleSaveNote = () => {
    updateBookmark(bookmark.id, { note: noteText });
    setIsEditingNote(false);
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !bookmark.tags.includes(newTag)) {
      updateBookmark(bookmark.id, { tags: [...bookmark.tags, newTag] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateBookmark(bookmark.id, { tags: bookmark.tags.filter(t => t !== tag) });
  };

  const handleCollectionChange = (collectionId: string) => {
    updateBookmark(bookmark.id, { collectionId: collectionId || null });
  };

  return (
    <div className="w-[380px] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">Bookmark Details</h2>
        <button
          onClick={() => setSelectedBookmarkId(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cover / Preview */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 h-40 flex items-center justify-center">
          {bookmark.cover ? (
            <img src={bookmark.cover} alt="" className="w-full h-full object-cover" />
          ) : bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-12 h-12 opacity-30" />
          ) : (
            <Globe size={32} className="text-gray-300 dark:text-gray-600" />
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <input
              value={bookmark.title}
              onChange={e => updateBookmark(bookmark.id, { title: e.target.value })}
              className="w-full text-base font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0"
            />
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-1 group"
            >
              {bookmark.favicon && <img src={bookmark.favicon} alt="" className="w-3 h-3" />}
              <span className="truncate">{getDomain(bookmark.url)}</span>
              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
            </a>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</label>
            <textarea
              value={bookmark.description}
              onChange={e => updateBookmark(bookmark.id, { description: e.target.value })}
              placeholder="Add a description..."
              rows={2}
              className="w-full mt-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 resize-none outline-none focus:border-blue-400"
            />
          </div>

          {/* Collection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              <FolderOpen size={12} />
              Collection
            </label>
            <select
              value={bookmark.collectionId || ''}
              onChange={e => handleCollectionChange(e.target.value)}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-400"
            >
              <option value="">Unsorted</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              <Tag size={12} />
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {bookmark.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }}
                placeholder="Add tag..."
                className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <FileText size={12} />
                Note
              </label>
              {!isEditingNote ? (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400"
                >
                  <Edit3 size={12} />
                </button>
              ) : (
                <button
                  onClick={handleSaveNote}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-blue-500"
                >
                  <Save size={12} />
                </button>
              )}
            </div>
            {isEditingNote ? (
              <textarea
                autoFocus
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setNoteText(bookmark.note); setIsEditingNote(false); } }}
                rows={4}
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-blue-400 rounded-lg px-3 py-2 resize-none outline-none"
              />
            ) : (
              <div
                onClick={() => setIsEditingNote(true)}
                className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 min-h-[60px] cursor-text"
              >
                {bookmark.note || <span className="text-gray-300 dark:text-gray-600 italic">Click to add a note...</span>}
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock size={12} />
              <span>Created {formatDate(bookmark.created)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock size={12} />
              <span>Updated {formatDate(bookmark.updated)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Globe size={12} />
              <span className="capitalize">{bookmark.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
        <button
          onClick={() => toggleStarred(bookmark.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            bookmark.starred
              ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          <Star size={14} className={bookmark.starred ? 'fill-yellow-400' : ''} />
          {bookmark.starred ? 'Starred' : 'Star'}
        </button>
        <button
          onClick={() => { deleteBookmark(bookmark.id); setSelectedBookmarkId(null); }}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
