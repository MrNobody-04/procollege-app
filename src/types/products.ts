export interface ProductItem {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  iconName: string; // identifier for icon
  category: 'collaboration' | 'learning' | 'intelligence' | 'productivity';
  status: 'active' | 'beta' | 'coming-soon';
  badge?: string;
  color: string;
  linkText: string;
  features: string[];
}
