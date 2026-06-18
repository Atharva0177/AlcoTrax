import React from 'react';
import { 
  Beer, Wine, Martini, Grape, Cherry, Flame, Rocket, 
  Star, Crown, Trophy, PartyPopper, Ghost, Zap, Sparkles,
  GlassWater, Coffee, Music, Heart
} from 'lucide-react';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export const PRESET_ICONS = [
  { id: 'Beer', icon: Beer },
  { id: 'Wine', icon: Wine },
  { id: 'Martini', icon: Martini },
  { id: 'GlassWater', icon: GlassWater },
  { id: 'Coffee', icon: Coffee },
  { id: 'Grape', icon: Grape },
  { id: 'Cherry', icon: Cherry },
  { id: 'Music', icon: Music },
  { id: 'Heart', icon: Heart },
  { id: 'Flame', icon: Flame },
  { id: 'Rocket', icon: Rocket },
  { id: 'Star', icon: Star },
  { id: 'Crown', icon: Crown },
  { id: 'Trophy', icon: Trophy },
  { id: 'PartyPopper', icon: PartyPopper },
  { id: 'Ghost', icon: Ghost },
  { id: 'Zap', icon: Zap },
  { id: 'Sparkles', icon: Sparkles }
];

export const DrinkIcon = ({ iconUrl, className }: { iconUrl?: string, className?: string }) => {
  if (!iconUrl) return <Beer className={className} />;
  
  if (iconUrl.startsWith('data:')) {
    return <img src={iconUrl} alt="Drink Icon" className={cn("object-cover rounded-xl", className)} />;
  }

  const PresetIcon = PRESET_ICONS.find(p => p.id === iconUrl)?.icon || Beer;
  return <PresetIcon className={className} />;
};
