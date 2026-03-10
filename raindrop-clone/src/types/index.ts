export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  excerpt: string;
  collectionId: string | null;
  tags: string[];
  favicon: string;
  cover: string;
  type: 'link' | 'article' | 'image' | 'video' | 'document';
  starred: boolean;
  created: string;
  updated: string;
  note: string;
  deleted: boolean;
}

export interface Collection {
  id: string;
  title: string;
  icon: string;
  color: string;
  parentId: string | null;
  order: number;
  expanded: boolean;
  created: string;
  updated: string;
}

export type ViewMode = 'list' | 'grid' | 'headlines' | 'masonry';

export type SortOption = 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc' | 'url-asc';

export type FilterType = 'all' | 'article' | 'image' | 'video' | 'document' | 'link' | 'starred' | 'untagged' | 'duplicates';

export type ActiveView =
  | { type: 'all' }
  | { type: 'unsorted' }
  | { type: 'trash' }
  | { type: 'collection'; id: string }
  | { type: 'tag'; name: string };
