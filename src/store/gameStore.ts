import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TILE_WIDTH, TILE_HEIGHT } from '../types/game';
import type { Tile, TileType } from '../types/game';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface LevelConfig {
  tileCount: number;
  typeCount: number;
  layerRange: number; // 堆叠层数范围
  spread: number; // 分散程度 (grid units)
}

const DEFAULT_LEVEL_CONFIGS: Record<Difficulty, LevelConfig> = {
  easy: {
    tileCount: 30, // 10组
    typeCount: 4,  // 容易消除
    layerRange: 3,
    spread: 3.5,     // 比较分散
  },
  medium: {
    tileCount: 66, // 22组
    typeCount: 6,
    layerRange: 6,
    spread: 2.8,     // 稍微集中
  },
  hard: {
    tileCount: 120, // 40组
    typeCount: 9,   // 所有类型
    layerRange: 10,
    spread: 2.2,    // 非常集中（羊了个羊风格）
  }
};

interface GameState {
  tiles: Tile[];
  slots: Tile[];
  status: 'idle' | 'playing' | 'won' | 'lost';
  difficulty: Difficulty;
  levelConfigs: Record<Difficulty, LevelConfig>;
  initGame: (difficulty?: Difficulty) => void;
  clickTile: (id: string) => void;
  restart: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  updateLevelConfig: (difficulty: Difficulty, config: Partial<LevelConfig>) => void;
  resetLevelConfig: (difficulty: Difficulty) => void;
  useImages: boolean;
  toggleUseImages: () => void;
}

const TILE_TYPES: TileType[] = ['carrot', 'fire', 'grass', 'stump', 'corn', 'wool', 'brush', 'bucket', 'milk'];

// 简单的矩形碰撞检测
export const isOverlapping = (t1: Tile, t2: Tile) => {
  // 稍微缩小一点判定区域，让视觉上边缘重叠不算完全遮挡，提升手感
  const margin = 4; // 增加一点 margin 让判定更宽松一点（更容易点到）
  return (
    Math.abs(t1.x - t2.x) < TILE_WIDTH - margin &&
    Math.abs(t1.y - t2.y) < TILE_HEIGHT - margin
  );
};

// 检查某个 Tile 是否被遮挡 (用于 UI 显示)
export const isTileCovered = (tile: Tile, allTiles: Tile[]) => {
  return allTiles.some(t => 
    t.status === 'deck' && 
    t.zIndex > tile.zIndex && 
    isOverlapping(t, tile)
  );
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      tiles: [],
      slots: [],
      status: 'idle',
      difficulty: 'easy',
      levelConfigs: DEFAULT_LEVEL_CONFIGS,
      useImages: false,

      toggleUseImages: () => {
        set((state) => ({ useImages: !state.useImages }));
      },

      setDifficulty: (difficulty) => {
        set({ difficulty });
        get().initGame(difficulty);
      },

      updateLevelConfig: (difficulty, config) => {
        set((state) => ({
          levelConfigs: {
            ...state.levelConfigs,
            [difficulty]: {
              ...state.levelConfigs[difficulty],
              ...config,
            },
          },
        }));
        // 如果正在修改当前难度的配置，重新开始游戏
        if (get().difficulty === difficulty) {
           get().initGame();
        }
      },

      resetLevelConfig: (difficulty) => {
        set((state) => ({
          levelConfigs: {
            ...state.levelConfigs,
            [difficulty]: DEFAULT_LEVEL_CONFIGS[difficulty],
          },
        }));
        if (get().difficulty === difficulty) {
           get().initGame();
        }
      },

      initGame: (diff) => {
        const difficulty = diff || get().difficulty;
        const config = get().levelConfigs[difficulty];
        
        // 确保 tileCount 是 3 的倍数
        const totalTiles = config.tileCount;
        const typesToUse = TILE_TYPES.slice(0, config.typeCount);
        
        let newTiles: Tile[] = [];
        
        // 生成成对的类型
        const deckTypes: TileType[] = [];
        for (let i = 0; i < totalTiles / 3; i++) {
          const type = typesToUse[i % typesToUse.length];
          deckTypes.push(type, type, type);
        }
        // 打乱类型
        deckTypes.sort(() => Math.random() - 0.5);

        // 生成位置
        deckTypes.forEach((type, index) => {
          // 改进的生成逻辑
          
          // 1. 确定层级: 
          // 在 hard 模式下，我们要制造"深坑"，即某些位置层级特别高
          // 这里使用一种混合策略：部分随机分散，部分集中堆叠
          
          let layer = 0;
          let gridX = 0;
          let gridY = 0;

          if (difficulty === 'hard' && index < totalTiles * 0.6) {
            // 60% 的牌集中在中心区域，形成"深坑"
            // 螺旋或随机堆叠
            const centerSpread = 1.8;
            gridX = (Math.random() * centerSpread * 2) - centerSpread;
            gridY = (Math.random() * centerSpread * 2) - centerSpread;
            // 层级随着 index 增加而增加，模拟向上堆叠
            layer = Math.floor(index / 4); 
          } else {
            // 剩余牌或简单模式：随机散布
            const spread = config.spread;
            gridX = (Math.floor(Math.random() * spread * 20) / 10) - spread; // 0.1 步进
            gridY = (Math.floor(Math.random() * spread * 20) / 10) - spread;
            
            // 简单模式层级低，困难模式层级高
            layer = Math.floor(Math.random() * config.layerRange);
          }

          // 对齐网格
          // 为了让遮挡更明显，我们强制对齐到半个格子或1/4格子
          const snap = 0.25; 
          gridX = Math.round(gridX / snap) * snap;
          gridY = Math.round(gridY / snap) * snap;
          
          newTiles.push({
            id: `tile-${index}`,
            type,
            layer, // 这里的 layer 只是初始逻辑层级，实际渲染层级由 zIndex 决定
            x: gridX * TILE_WIDTH,
            y: gridY * TILE_HEIGHT,
            zIndex: 0, // 稍后计算
            status: 'deck',
          });
        });

        // 关键：计算物理层级关系 (Topological Sort 简化版)
        // 如果 A 遮挡 B，则 A 的 zIndex 必须大于 B
        // 简单的处理方法：按层级排序后赋予递增的 zIndex
        // 但为了让生成的结构合理，我们需要确保 visually "on top" 的东西逻辑上也 on top
        
        // 这里我们简单地根据生成的 layer 属性排序，
        // 在 hard 模式下，后生成的牌（index大）往往在上面
        newTiles.sort((a, b) => a.layer - b.layer);
        
        // 重新赋值 zIndex 确保唯一
        newTiles.forEach((t, i) => t.zIndex = i);

        set({ tiles: newTiles, slots: [], status: 'playing', difficulty });
      },

      clickTile: (id) => {
        const { tiles, slots, status } = get();
        if (status !== 'playing') return;

        const clickedTile = tiles.find(t => t.id === id);
        if (!clickedTile || clickedTile.status !== 'deck') return;

        // 检查是否被遮挡 (双重检查，虽然UI层应该已经禁用了点击)
        const isCovered = tiles.some(t => 
          t.status === 'deck' && 
          t.zIndex > clickedTile.zIndex && // 只有 zIndex 比它大的才可能遮挡它
          isOverlapping(t, clickedTile)
        );
        
        if (isCovered) return;

        // 移动到槽位，并尝试归类（插入到相同类型的最后一个后面）
        let newSlots = [...slots];
        const lastSameTypeIndex = newSlots.map(t => t.type).lastIndexOf(clickedTile.type);
        
        if (lastSameTypeIndex !== -1) {
          newSlots.splice(lastSameTypeIndex + 1, 0, { ...clickedTile, status: 'slot' } as Tile);
        } else {
          newSlots.push({ ...clickedTile, status: 'slot' } as Tile);
        }
        
        // 更新 tiles
        const newTiles = tiles.map(t => 
          t.id === id ? { ...t, status: 'slot' as const } : t
        );

        set({ tiles: newTiles, slots: newSlots });

        // 检查消除
        // 统计各类型数量
        const typeCounts: Record<string, number> = {};
        newSlots.forEach(t => {
          typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
        });

        const typesToEliminate = Object.keys(typeCounts).filter(type => typeCounts[type] >= 3);

        if (typesToEliminate.length > 0) {
          // 延迟一点消除，为了动画效果（这里先直接消除逻辑，动画由UI处理）
          // 实际开发中最好用 setTimeout 分离状态更新，但在 zustand 里直接更新状态也行
          setTimeout(() => {
            // 注意：这里需要重新获取 slots，因为可能有连续点击
            // 但简单起见，我们假设用户手速没那么快，或者 zustand 批处理了
            
            // 实际上，为了安全，应该基于当前的 state 计算
            const latestSlots = get().slots;
            const remainingSlots = latestSlots.filter(t => !typesToEliminate.includes(t.type));
            
            // 标记消除的卡牌
            const eliminatedIds = latestSlots
              .filter(t => typesToEliminate.includes(t.type))
              .map(t => t.id);

            set(state => ({
              slots: remainingSlots,
              tiles: state.tiles.map(t => 
                eliminatedIds.includes(t.id) ? { ...t, status: 'eliminated' } : t
              )
            }));

            // 检查胜利
            const remainingDeck = get().tiles.filter(t => t.status === 'deck');
            if (remainingDeck.length === 0) {
               set({ status: 'won' });
            }
          }, 200); 
        } else {
          // 检查是否占满卡槽
          if (newSlots.length >= 7) {
            set({ status: 'lost' });
          }
        }
      },

      restart: () => {
        get().initGame();
      },
    }),
    {
      name: 'sheep-game-storage',
      partialize: (state) => ({ 
        difficulty: state.difficulty,
        levelConfigs: state.levelConfigs,
        useImages: state.useImages,
      }), // Only persist config and preference
    }
  )
);
