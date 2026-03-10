'use client';

import React, { useState } from 'react';
import {
  LayoutList, LayoutGrid, AlignJustify, Columns3,
  ArrowUpDown, Filter, Plus, Trash2
} from 'lucide-react';
import { useAppStore } from '@/store/StoreContext';
import { ViewMode, SortOption, FilterType } from '@/types';

export default function Toolbar({ onAddBookmark }: { onAddBookmark: () => void }) {
  const {
    activeView, viewMode, setViewMode, sortOption, setSortOption,
    filterType, setFilterType, getFilteredBookmarks, emptyTrash, collections
  } = useAppStore();

  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const filteredBookmarks = getFilteredBookmarks();

  const viewModes: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: 'list', icon: LayoutList, label: 'List' },
    { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
    { mode: 'headlines', icon: AlignJustify, label: 'Headlines' },
    { mode: 'masonry', icon: Columns3, label: 'Masonry' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'created-desc', label: 'Newest first' },
    { value: 'created-asc', label: 'Oldest first' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
    { value: 'url-asc', label: 'Site A-Z' },
  ];

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All types' },
    { value: 'article', label: 'Articles' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'document', label: 'Documents' },
    { value: 'link', label: 'Links' },
    { value: 'starred', label: 'Starred' },
    { value: 'untagged', label: 'Without tags' },
    { value: 'duplicates', label: 'Duplicates' },
  ];

  const getTitle = () => {
    switch (activeView.type) {
      case 'all': return 'All Bookmarks';
      case 'unsorted': return 'Unsorted';
      case 'trash': return 'Trash';
      case 'tag': return `#${activeView.name}`;
      case 'collection': {
        const col = collections.find(c => c.id === activeView.id);
        return col?.title || 'Collection';
      }
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{getTitle()}</h1>
        <span className="text-sm text-gray-400 tabular-nums">{filteredBookmarks.length}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {viewModes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={label}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
            className={`p-2 rounded-lg transition-colors ${
              showSort ? 'bg-gray-100 dark:bg-gray-800 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Sort"
          >
            <ArrowUpDown size={16} />
          </button>
          {showSort && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortOption(opt.value); setShowSort(false); }}
                    className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
                      sortOption === opt.value
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
            className={`p-2 rounded-lg transition-colors ${
              filterType !== 'all' || showFilter
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Filter"
          >
            <Filter size={16} />
          </button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]">
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterType(opt.value); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
                      filterType === opt.value
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add / Empty trash button */}
        {activeView.type === 'trash' ? (
          <button
            onClick={emptyTrash}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={14} />
            Empty Trash
          </button>
        ) : (
          <button
            onClick={onAddBookmark}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
