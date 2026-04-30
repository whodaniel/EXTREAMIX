import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Lock, Bot } from 'lucide-react';
import { ENTITLEMENTS } from '../services/revenueCat';

const ADDONS = [
  {
    id: 'ai_filter_forge',
    name: 'AI Filter Forge',
    description: 'Use advanced AI to generate and design live video filters and visual effects using natural language. Perfect for generating custom dynamic broadcast overlays.',
    icon: Sparkles,
    entitlementKey: ENTITLEMENTS.AI_FILTER_FORGE,
    price: '$1.99 (50 Credits)',
    features: [
      'Text-to-Shader Live Rendering',
      'Uses MediaPipe & WebGL integration',
      'Advanced Custom Pixel Operations',
      'Includes 50 Filter Generation credits'
    ]
  },
  {
    id: 'ai_generator_plugin',
    name: 'AI Synth Scaffolder',
    description: 'Use advanced AI to generate intelligent synth patches, complex crossover matrices, and generate dynamic background visuals directly from text prompts.',
    icon: Bot,
    entitlementKey: ENTITLEMENTS.AI_SYNTH_SCAFFOLDER,
    price: '$4.99/mo',
    features: [
      'Prompt-to-Matrix Routing',
      'AI Generated Texture Maps',
      'Intelligent Signal Pathing',
      'Includes 500 AI credits per month'
    ]
  },
  {
    id: 'spatial_audio_plugin',
    name: 'Spatial Audio Engine',
    description: 'Unlock 3D spatial audio tools to pan audio channels across depth and width, perfect for immersive broadcast formats.',
    icon: Sparkles,
    entitlementKey: ENTITLEMENTS.SPATIAL_AUDIO,
    price: '$9.99 (One-Time)',
    features: [
      'Ambisonic Matrix Encoder',
      'True 3D Panning',
      'HRTF Binaural Output'
    ]
  },
  {
    id: 'ai_theme_forge',
    name: 'AI Theme Forge',
    description: 'Describe any aesthetic, mood, or setting, and let our generative AI construct a completely custom color palette and apply it instantly to the application interface.',
    icon: Sparkles,
    entitlementKey: ENTITLEMENTS.AI_THEME_FORGE,
    price: '$2.99 (Lifetime)',
    features: [
      'Text-to-Theme AI Generation',
      'Intelligent Color Mixing',
      'Saved Custom Palettes',
      'Instant Global Application'
    ]
  }
];

interface AddonsViewProps {
  activeEntitlements: string[];
  isPro: boolean;
  onPurchaseAddon: (offeringId?: string) => Promise<boolean>;
}

export const AddonsView = ({ 
  activeEntitlements, 
  isPro,
  onPurchaseAddon 
}: AddonsViewProps) => {
  const [purchasingId, setPurchasingId] = React.useState<string | null>(null);

  const handleUnlock = async (addonId: string) => {
    setPurchasingId(addonId);
    try {
      await onPurchaseAddon(addonId);
    } catch (e) {
      console.error('Addon unlock failed:', e);
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="flex-1 w-full bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col p-8">
      <div className="mb-8">
        <h2 className="font-headline text-3xl text-white tracking-widest uppercase font-black mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Add-ons & Plugins
        </h2>
        <p className="text-outline max-w-2xl text-sm font-mono leading-relaxed">
          Expand your studio's capabilities with specialized modules. Some foundational features are free, 
          while computational-heavy features (like AI models) are offered as premium add-ons to cover infrastructure costs.
        </p>
        {isPro && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl inline-flex">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-headline text-primary tracking-widest uppercase font-bold">
              Extreamix Pro: All add-ons included
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10">
        {ADDONS.map(addon => {
          const isUnlocked = isPro || activeEntitlements.includes(addon.entitlementKey);
          const isPurchasing = purchasingId === addon.id;

          return (
            <motion.div 
              key={addon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                isUnlocked 
                  ? 'bg-primary/5 border-primary/30 shadow-[0_0_30px_rgba(56,189,248,0.1)]' 
                  : 'bg-surface-container-low/50 border-white/5 opacity-80'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/50'}`}>
                  <addon.icon className="w-6 h-6" />
                </div>
                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-[9px] font-headline tracking-widest text-primary uppercase bg-primary/10 px-2 py-1 rounded">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-headline tracking-widest text-outline uppercase bg-white/5 px-2 py-1 rounded">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>

              <h3 className="font-headline text-xl text-white uppercase tracking-wider mb-2">{addon.name}</h3>
              <p className="text-xs text-outline mb-6 leading-relaxed flex-1">{addon.description}</p>

              <div className="space-y-3 mb-8">
                {addon.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-white/70">
                    <ArrowRight className="w-3 h-3 text-primary mt-0.5 opacity-70 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {!isUnlocked && (
                <button 
                  onClick={() => handleUnlock(addon.id)}
                  disabled={isPurchasing}
                  className="w-full py-3 rounded-xl bg-surface-container-highest hover:bg-white text-white hover:text-black transition-colors font-headline font-bold text-xs uppercase tracking-widest flex items-center justify-between px-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isPurchasing ? 'PROCESSING...' : 'Unlock Module'}</span>
                  <span className="opacity-70 group-hover:opacity-100">{addon.price}</span>
                </button>
              )}
              {isUnlocked && (
                <button className="w-full py-3 rounded-xl bg-primary/20 text-primary font-headline font-bold text-xs uppercase tracking-widest border border-primary/30">
                  Settings
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
