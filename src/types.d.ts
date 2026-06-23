/**
 * TypeScript definitions for the frontend (JS with JSDoc).
 */

// ============================================================
// Core types from core.mjs
// ============================================================

export interface Profile {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  theme: string;
  subdomain: string;
}

export interface MiniSite {
  published: boolean;
  businessName: string;
  headline: string;
  description: string;
  services: string[];
  whatsapp: string;
  email: string;
  address: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  showClassifieds: boolean;
  showMap: boolean;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  active: boolean;
  startAt: string;
  endAt: string;
}

export interface Classified {
  id: string;
  kind: string;
  kindLabel: string;
  bigTheme?: string;
  bigThemeLabel?: string;
  showInBigTheme?: boolean;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  location: string;
  contactUrl: string;
  imageUrl: string;
  tags: string[];
  active: boolean;
  featured: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface ShortLink {
  id: string;
  slug: string;
  url: string;
  active: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  targetId: string | null;
  at: string;
  visitor: string;
  source: string;
  medium: string;
  campaign: string;
}

export interface AppState {
  profile: Profile;
  miniSite: MiniSite;
  links: Link[];
  classifieds: Classified[];
  shortLinks: ShortLink[];
  events: AnalyticsEvent[];
}

export interface AnalyticsMetrics {
  pageViews: number;
  clicks: number;
  uniqueVisitors: number;
  whatsappVisits: number;
  byTarget: Record<string, number>;
  bySource: Record<string, number>;
}

export interface TrafficAttribution {
  source: string;
  medium: string;
  campaign: string;
}
