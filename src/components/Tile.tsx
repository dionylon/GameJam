import React from 'react';
import { TILE_WIDTH, TILE_HEIGHT } from '../types/game';
import type { Tile as TileType } from '../types/game';
import { Carrot, Flame, Leaf, Trees, Wheat, Scissors, Brush, CupSoda, Milk } from 'lucide-react';
import { clsx } from 'clsx';

interface TileProps {
  tile: TileType;
  isCovered?: boolean;
  onClick?: () => void;
  inSlot?: boolean;
  useImages?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  carrot: Carrot,
  fire: Flame,
  grass: Leaf,
  stump: Trees,
  corn: Wheat,
  wool: Scissors,
  brush: Brush,
  bucket: CupSoda,
  milk: Milk,
};

const Tile: React.FC<TileProps> = ({ tile, isCovered, onClick, inSlot, useImages }) => {
  const Icon = iconMap[tile.type] || Leaf;
  const [imgError, setImgError] = React.useState(false);

  // 当 useImages 变化时，重置错误状态，以便重新尝试加载
  React.useEffect(() => {
    setImgError(false);
  }, [useImages]);

  return (
    <div
      onClick={!isCovered ? onClick : undefined}
      className={clsx(
        "flex items-center justify-center rounded-xl transition-all duration-200 select-none overflow-hidden",
        "bg-[#fdfdfd] border-2 border-b-4 border-green-800",
        inSlot ? "relative" : "absolute cursor-pointer hover:scale-105 active:scale-95 active:border-b-2 active:translate-y-[2px]",
        isCovered && "brightness-[0.4] cursor-not-allowed hover:scale-100",
        !isCovered && !inSlot && "shadow-lg hover:shadow-xl hover:-translate-y-1"
      )}
      style={{
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        left: inSlot ? undefined : `calc(50% + ${tile.x}px)`,
        top: inSlot ? undefined : `calc(50% + ${tile.y}px)`,
        transform: inSlot ? undefined : 'translate(-50%, -50%)',
        zIndex: inSlot ? undefined : tile.zIndex,
      }}
    >
      {useImages && !imgError ? (
        <img 
          src={`/tiles/${tile.type}.png`} 
          alt={tile.type}
          className="w-4/5 h-4/5 object-contain drop-shadow-sm pointer-events-none"
          onError={() => setImgError(true)}
        />
      ) : (
        <Icon 
          size={28} 
          className={clsx(
            "drop-shadow-sm",
            tile.type === 'fire' && "text-red-500",
            tile.type === 'carrot' && "text-orange-500",
            tile.type === 'corn' && "text-yellow-500",
            tile.type === 'grass' && "text-green-500",
            tile.type === 'stump' && "text-amber-800",
            tile.type === 'wool' && "text-slate-400",
            tile.type === 'brush' && "text-amber-600",
            tile.type === 'bucket' && "text-blue-400",
            tile.type === 'milk' && "text-blue-200",
            // Fallback color
            !['fire', 'carrot', 'corn', 'grass', 'stump', 'wool', 'brush', 'bucket', 'milk'].includes(tile.type) && "text-green-600"
          )} 
        />
      )}
    </div>
  );
};

export default Tile;
