export function detectContentType(url: string): 'link' | 'article' | 'image' | 'video' | 'document' {
  const lower = url.toLowerCase();

  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'];
  if (imageExts.some(ext => lower.includes(ext))) return 'image';

  const videoHosts = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'];
  const videoExts = ['.mp4', '.webm', '.avi', '.mov'];
  if (videoHosts.some(h => lower.includes(h)) || videoExts.some(ext => lower.includes(ext))) return 'video';

  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
  if (docExts.some(ext => lower.includes(ext))) return 'document';

  const articleHosts = ['medium.com', 'dev.to', 'hashnode.', 'substack.com', 'blog.', 'article'];
  if (articleHosts.some(h => lower.includes(h))) return 'article';

  return 'link';
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}
