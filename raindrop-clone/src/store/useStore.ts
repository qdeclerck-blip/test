'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark, Collection, ViewMode, SortOption, FilterType, ActiveView } from '@/types';
import { detectContentType, getFaviconUrl } from '@/utils/metadata';

const STORAGE_KEY_BOOKMARKS = 'raindrop_bookmarks';
const STORAGE_KEY_COLLECTIONS = 'raindrop_collections';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full
  }
}

const defaultCollections: Collection[] = [
  {
    id: 'col-default-1',
    title: 'Quick Links',
    icon: 'Zap',
    color: '#f59e0b',
    parentId: null,
    order: 0,
    expanded: true,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'col-default-2',
    title: 'Reading List',
    icon: 'BookOpen',
    color: '#3b82f6',
    parentId: null,
    order: 1,
    expanded: true,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'col-default-3',
    title: 'Design Inspiration',
    icon: 'Palette',
    color: '#ec4899',
    parentId: null,
    order: 2,
    expanded: true,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
];

export function useStore() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'all' });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('created-desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const storedBookmarks = loadFromStorage<Bookmark[]>(STORAGE_KEY_BOOKMARKS, []);
    const storedCollections = loadFromStorage<Collection[]>(STORAGE_KEY_COLLECTIONS, []);
    setBookmarks(storedBookmarks);
    setCollections(storedCollections.length > 0 ? storedCollections : defaultCollections);
    setIsLoaded(true);
  }, []);

  // Persist bookmarks
  useEffect(() => {
    if (isLoaded) saveToStorage(STORAGE_KEY_BOOKMARKS, bookmarks);
  }, [bookmarks, isLoaded]);

  // Persist collections
  useEffect(() => {
    if (isLoaded) saveToStorage(STORAGE_KEY_COLLECTIONS, collections);
  }, [collections, isLoaded]);

  // === BOOKMARK OPERATIONS ===
  const addBookmark = useCallback((data: { url: string; title?: string; description?: string; collectionId?: string | null; tags?: string[] }) => {
    const now = new Date().toISOString();
    const bookmark: Bookmark = {
      id: uuidv4(),
      title: data.title || data.url,
      url: data.url,
      description: data.description || '',
      excerpt: '',
      collectionId: data.collectionId ?? null,
      tags: data.tags || [],
      favicon: getFaviconUrl(data.url),
      cover: '',
      type: detectContentType(data.url),
      starred: false,
      created: now,
      updated: now,
      note: '',
      deleted: false,
    };
    setBookmarks(prev => [bookmark, ...prev]);
    return bookmark;
  }, []);

  const updateBookmark = useCallback((id: string, updates: Partial<Bookmark>) => {
    setBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, ...updates, updated: new Date().toISOString() } : b
    ));
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, deleted: true, updated: new Date().toISOString() } : b
    ));
  }, []);

  const restoreBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, deleted: false, updated: new Date().toISOString() } : b
    ));
  }, []);

  const permanentlyDeleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const emptyTrash = useCallback(() => {
    setBookmarks(prev => prev.filter(b => !b.deleted));
  }, []);

  const toggleStarred = useCallback((id: string) => {
    setBookmarks(prev => prev.map(b =>
      b.id === id ? { ...b, starred: !b.starred, updated: new Date().toISOString() } : b
    ));
  }, []);

  // === COLLECTION OPERATIONS ===
  const addCollection = useCallback((data: { title: string; icon?: string; color?: string; parentId?: string | null }) => {
    const collection: Collection = {
      id: uuidv4(),
      title: data.title,
      icon: data.icon || 'Folder',
      color: data.color || '#6b7280',
      parentId: data.parentId ?? null,
      order: collections.length,
      expanded: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    setCollections(prev => [...prev, collection]);
    return collection;
  }, [collections.length]);

  const updateCollection = useCallback((id: string, updates: Partial<Collection>) => {
    setCollections(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates, updated: new Date().toISOString() } : c
    ));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    // Move bookmarks from this collection to unsorted
    setBookmarks(prev => prev.map(b =>
      b.collectionId === id ? { ...b, collectionId: null } : b
    ));
    // Remove child collections recursively
    const getChildIds = (parentId: string): string[] => {
      const children = collections.filter(c => c.parentId === parentId);
      return children.flatMap(c => [c.id, ...getChildIds(c.id)]);
    };
    const idsToRemove = [id, ...getChildIds(id)];
    setCollections(prev => prev.filter(c => !idsToRemove.includes(c.id)));
  }, [collections]);

  const toggleCollectionExpanded = useCallback((id: string) => {
    setCollections(prev => prev.map(c =>
      c.id === id ? { ...c, expanded: !c.expanded } : c
    ));
  }, []);

  // === FILTERED & SORTED BOOKMARKS ===
  const getFilteredBookmarks = useCallback(() => {
    let filtered = bookmarks;

    // Active view filter
    switch (activeView.type) {
      case 'all':
        filtered = filtered.filter(b => !b.deleted);
        break;
      case 'unsorted':
        filtered = filtered.filter(b => !b.deleted && b.collectionId === null);
        break;
      case 'trash':
        filtered = filtered.filter(b => b.deleted);
        break;
      case 'collection':
        filtered = filtered.filter(b => !b.deleted && b.collectionId === activeView.id);
        break;
      case 'tag':
        filtered = filtered.filter(b => !b.deleted && b.tags.includes(activeView.name));
        break;
    }

    // Content type / special filter
    if (filterType !== 'all') {
      switch (filterType) {
        case 'starred':
          filtered = filtered.filter(b => b.starred);
          break;
        case 'untagged':
          filtered = filtered.filter(b => b.tags.length === 0);
          break;
        case 'duplicates': {
          const urlCounts = new Map<string, number>();
          bookmarks.filter(b => !b.deleted).forEach(b => {
            urlCounts.set(b.url, (urlCounts.get(b.url) || 0) + 1);
          });
          const dupUrls = new Set([...urlCounts.entries()].filter(([, c]) => c > 1).map(([u]) => u));
          filtered = filtered.filter(b => dupUrls.has(b.url));
          break;
        }
        default:
          filtered = filtered.filter(b => b.type === filterType);
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q)) ||
        b.note.toLowerCase().includes(q)
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortOption) {
      case 'created-desc':
        sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;
      case 'created-asc':
        sorted.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'url-asc':
        sorted.sort((a, b) => a.url.localeCompare(b.url));
        break;
    }

    return sorted;
  }, [bookmarks, activeView, filterType, searchQuery, sortOption]);

  // === TAGS ===
  const getAllTags = useCallback(() => {
    const tagCounts = new Map<string, number>();
    bookmarks.filter(b => !b.deleted).forEach(b => {
      b.tags.forEach(t => {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      });
    });
    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [bookmarks]);

  // === COUNTS ===
  const getCounts = useCallback(() => {
    const active = bookmarks.filter(b => !b.deleted);
    return {
      all: active.length,
      unsorted: active.filter(b => b.collectionId === null).length,
      trash: bookmarks.filter(b => b.deleted).length,
      byCollection: (id: string) => active.filter(b => b.collectionId === id).length,
    };
  }, [bookmarks]);

  return {
    // State
    bookmarks, collections, activeView, viewMode, sortOption, filterType,
    searchQuery, selectedBookmarkId, sidebarWidth, isLoaded,

    // Setters
    setActiveView, setViewMode, setSortOption, setFilterType,
    setSearchQuery, setSelectedBookmarkId, setSidebarWidth,

    // Bookmark operations
    addBookmark, updateBookmark, deleteBookmark, restoreBookmark,
    permanentlyDeleteBookmark, emptyTrash, toggleStarred,

    // Collection operations
    addCollection, updateCollection, deleteCollection, toggleCollectionExpanded,

    // Computed
    getFilteredBookmarks, getAllTags, getCounts,
  };
}
