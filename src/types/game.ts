export type TileType = 'carrot' | 'fire' | 'grass' | 'stump' | 'corn' | 'wool' | 'brush' | 'bucket' | 'milk';

export interface Tile {
  id: string;
  type: TileType;
  layer: number;
  x: number; // 这里的x,y是网格坐标，例如 0-7
  y: number;
  zIndex: number; // 用于渲染顺序，通常等于 layer * 100 + index
  status: 'deck' | 'slot' | 'eliminated';
}

export interface LevelConfig {
  layerCount: number;
  typesCount: number; // 使用多少种图案
  tileCount: number; // 总卡牌数，必须是3的倍数
}

export const TILE_WIDTH = 48; // 像素
export const TILE_HEIGHT = 56; // 像素
export const GRID_SIZE = 8; // 每次偏移的像素单位，用于微调位置
