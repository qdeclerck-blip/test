'use client';

import React, { useState } from 'react';
import {
  Inbox, Bookmark, Trash2, Plus, ChevronDown, ChevronRight,
  FolderOpen, Hash, Zap, BookOpen, Palette, Folder, Globe,
  Star, Code, Music, Camera, Film, FileText, Heart, Home,
  ShoppingBag, Briefcase, GraduationCap, Plane, Coffee,
  Gamepad2, Cpu, Newspaper, Rss, Search
} from 'lucide-react';
import { useAppStore } from '@/store/StoreContext';
import { Collection } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, BookOpen, Palette, Folder, FolderOpen, Globe, Star, Code, Music,
  Camera, Film, FileText, Heart, Home, ShoppingBag, Briefcase,
  GraduationCap, Plane, Coffee, Gamepad2, Cpu, Newspaper, Rss, Search,
  Inbox, Bookmark, Trash2, Hash, Plus
};

function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Folder;
}

interface CollectionItemProps {
  collection: Collection;
  depth: number;
  childCollections: Collection[];
  allCollections: Collection[];
}

function CollectionItem({ collection, depth, childCollections, allCollections }: CollectionItemProps) {
  const { activeView, setActiveView, toggleCollectionExpanded, getCounts, deleteCollection, updateCollection } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(collection.title);
  const [showContext, setShowContext] = useState(false);

  const counts = getCounts();
  const count = counts.byCollection(collection.id);
  const isActive = activeView.type === 'collection' && activeView.id === collection.id;
  const hasChildren = childCollections.length > 0;
  const IconComponent = getIcon(collection.icon);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateCollection(collection.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const nestedChildren = allCollections
    .filter(c => c.parentId === collection.id)
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg mx-2 text-sm transition-colors relative ${
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => setActiveView({ type: 'collection', id: collection.id })}
        onContextMenu={(e) => { e.preventDefault(); setShowContext(!showContext); }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollectionExpanded(collection.id); }}
            className="p-0.5 -ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {collection.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <IconComponent size={16} style={{ color: collection.color }} className="shrink-0" />

        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
            className="flex-1 bg-white dark:bg-gray-800 border border-blue-400 rounded px-1 py-0 text-sm outline-none"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{collection.title}</span>
        )}

        {count > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{count}</span>
        )}

        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setShowContext(!showContext); }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"
          >
            <span className="text-xs">•••</span>
          </button>
        </div>
      </div>

      {showContext && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContext(false)} />
          <div className="absolute z-50 ml-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 text-sm min-w-[160px]">
            <button
              className="w-full text-left px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              onClick={() => { setIsEditing(true); setShowContext(false); }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
              onClick={() => { deleteCollection(collection.id); setShowContext(false); }}
            >
              Delete
            </button>
          </div>
        </>
      )}

      {collection.expanded && nestedChildren.map(child => (
        <CollectionItem
          key={child.id}
          collection={child}
          depth={depth + 1}
          childCollections={allCollections.filter(c => c.parentId === child.id)}
          allCollections={allCollections}
        />
      ))}
    </div>
  );
}

export default function Sidebar() {
  const {
    activeView, setActiveView, collections, addCollection,
    getCounts, getAllTags, searchQuery, setSearchQuery
  } = useAppStore();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const counts = getCounts();
  const tags = getAllTags();
  const rootCollections = collections.filter(c => c.parentId === null).sort((a, b) => a.order - b.order);

  const handleAddCollection = () => {
    if (newCollectionTitle.trim()) {
      const icons = ['Folder', 'Star', 'Heart', 'Code', 'Globe', 'Music', 'Camera', 'Film', 'FileText'];
      const colors = ['#6b7280', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      addCollection({
        title: newCollectionTitle.trim(),
        icon: icons[Math.floor(Math.random() * icons.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      setNewCollectionTitle('');
      setShowNewCollection(false);
    }
  };

  const navItems = [
    { type: 'all' as const, icon: Bookmark, label: 'All Bookmarks', count: counts.all },
    { type: 'unsorted' as const, icon: Inbox, label: 'Unsorted', count: counts.unsorted },
    { type: 'trash' as const, icon: Trash2, label: 'Trash', count: counts.trash },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 select-none">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-1 space-y-0.5">
        {navItems.map(item => {
          const isActive = activeView.type === item.type;
          return (
            <button
              key={item.type}
              onClick={() => setActiveView({ type: item.type })}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="my-3 mx-4 border-t border-gray-200 dark:border-gray-700" />

      {/* Collections */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-4 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Collections
          </span>
          <button
            onClick={() => setShowNewCollection(true)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewCollection && (
          <div className="mx-3 mb-2">
            <input
              autoFocus
              placeholder="Collection name..."
              value={newCollectionTitle}
              onChange={e => setNewCollectionTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCollection(); if (e.key === 'Escape') setShowNewCollection(false); }}
              onBlur={() => { if (!newCollectionTitle.trim()) setShowNewCollection(false); }}
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-400 rounded-lg text-sm outline-none"
            />
          </div>
        )}

        <div className="space-y-0.5">
          {rootCollections.map(collection => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              depth={0}
              childCollections={collections.filter(c => c.parentId === collection.id)}
              allCollections={collections}
            />
          ))}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <div className="my-3 mx-4 border-t border-gray-200 dark:border-gray-700" />
            <div className="px-4 mb-1">
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              >
                {tagsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Tags
              </button>
            </div>
            {tagsExpanded && (
              <div className="space-y-0.5">
                {tags.map(tag => {
                  const isActive = activeView.type === 'tag' && activeView.name === tag.name;
                  return (
                    <button
                      key={tag.name}
                      onClick={() => setActiveView({ type: 'tag', name: tag.name })}
                      className={`w-full flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg mx-1 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Hash size={14} className="text-gray-400 shrink-0" />
                      <span className="flex-1 text-left truncate">{tag.name}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{tag.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
