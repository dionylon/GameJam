import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore, isTileCovered } from '../store/gameStore';
import Tile from './Tile';
import { TILE_WIDTH, TILE_HEIGHT } from '../types/game';
import { RotateCcw, Play, Settings, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';

const Game: React.FC = () => {
  const { 
    tiles, slots, status, difficulty, levelConfigs, useImages,
    initGame, clickTile, restart, setDifficulty, updateLevelConfig, resetLevelConfig
  } = useGameStore();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  // 计算所有deck中卡牌的遮挡状态
  // 这是一个优化点，避免每个Tile单独计算
  const coveredState = useMemo(() => {
    const state: Record<string, boolean> = {};
    const deckTiles = tiles.filter(t => t.status === 'deck');
    deckTiles.forEach(t => {
      state[t.id] = isTileCovered(t, deckTiles);
    });
    return state;
  }, [tiles]);

  const deckTiles = tiles.filter(t => t.status === 'deck');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#c3fe8b] p-4 font-sans relative overflow-hidden">
      {/* 标题栏 */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <h1 className="text-3xl font-bold text-green-900 drop-shadow-md">羊了个羊 Clone</h1>
      </div>

      {/* Settings Button */}
      <div className="absolute top-4 right-4 z-[5000]">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 bg-white/80 rounded-full hover:bg-white shadow-md transition-all active:scale-95"
          title="设置"
        >
          <Settings size={24} className="text-green-800" />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[5001] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
                <Settings className="w-5 h-5" /> 游戏设置
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-green-100 rounded-full text-green-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Difficulty Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">选择难度</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={clsx(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        difficulty === d
                          ? "bg-white text-green-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {d === 'easy' && '简单'}
                      {d === 'medium' && '普通'}
                      {d === 'hard' && '困难'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Settings */}
              {/* 图片设置已强制开启，暂不需要显示开关，如果未来需要切换可以解开注释
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">样式设置</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-sm text-gray-600">使用图片素材</span>
                  <button 
                    onClick={toggleUseImages}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      useImages ? "bg-green-500" : "bg-gray-300"
                    )}
                  >
                    <div className={clsx(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      useImages ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 px-1">
                  开启后将尝试加载 <code className="bg-gray-100 px-1 rounded">/public/tiles/[type].png</code>，如不存在则显示默认图标。
                </p>
              </div>
              
              <div className="h-px bg-gray-100" />
              */}

              {/* Parameters */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-green-800">
                  配置参数 ({difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '普通' : '困难'})
                </h3>
                
                {/* Tile Count */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">卡片数量</span>
                    <span className="font-mono font-bold text-green-600">{levelConfigs[difficulty].tileCount}</span>
                  </div>
                  <input
                    type="range"
                    min="12" max="240" step="3"
                    value={levelConfigs[difficulty].tileCount}
                    onChange={(e) => updateLevelConfig(difficulty, { tileCount: parseInt(e.target.value) })}
                    className="w-full accent-green-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-400">必须是3的倍数</p>
                </div>

                {/* Type Count */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">卡片种类</span>
                    <span className="font-mono font-bold text-green-600">{levelConfigs[difficulty].typeCount}</span>
                  </div>
                  <input
                    type="range"
                    min="3" max="9" step="1"
                    value={levelConfigs[difficulty].typeCount}
                    onChange={(e) => updateLevelConfig(difficulty, { typeCount: parseInt(e.target.value) })}
                    className="w-full accent-green-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Layer Range */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">堆叠层数</span>
                    <span className="font-mono font-bold text-green-600">{levelConfigs[difficulty].layerRange}</span>
                  </div>
                  <input
                    type="range"
                    min="2" max="15" step="1"
                    value={levelConfigs[difficulty].layerRange}
                    onChange={(e) => updateLevelConfig(difficulty, { layerRange: parseInt(e.target.value) })}
                    className="w-full accent-green-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Spread */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">分散度 (Spread)</span>
                    <span className="font-mono font-bold text-green-600">{levelConfigs[difficulty].spread}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5" max="5.0" step="0.1"
                    value={levelConfigs[difficulty].spread}
                    onChange={(e) => updateLevelConfig(difficulty, { spread: parseFloat(e.target.value) })}
                    className="w-full accent-green-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-400">数值越小越集中（越难），越大越分散</p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <button
                onClick={() => resetLevelConfig(difficulty)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <RefreshCcw size={16} /> 重置当前难度默认值
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100">
               <button
                 onClick={() => setShowSettings(false)}
                 className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
               >
                 确认并关闭
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 游戏区域 */}
      <div className="relative w-full max-w-lg h-[600px] mt-12 mb-8 bg-green-200/50 rounded-xl border-4 border-green-600/30">
        {deckTiles.map(tile => (
            <Tile 
            key={tile.id} 
            tile={tile} 
            isCovered={coveredState[tile.id]}
            onClick={() => clickTile(tile.id)}
            useImages={useImages}
          />
        ))}
        {deckTiles.length === 0 && status === 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center text-green-800 font-bold opacity-50">
            暂无卡牌
          </div>
        )}
      </div>

      {/* 槽位栏 */}
      <div className="w-full max-w-md h-20 bg-gray-800/20 rounded-lg border-2 border-gray-600 flex items-center justify-center gap-1 px-2 relative">
        {slots.map((tile, index) => (
          <div key={`${tile.id}-${index}`} className="transition-all animate-in fade-in zoom-in duration-200">
             <Tile tile={tile} inSlot useImages={useImages} />
          </div>
        ))}
        {/* 占位格子，保持布局稳定 */}
        {Array.from({ length: 7 - slots.length }).map((_, i) => (
           <div key={`empty-${i}`} className="border-2 border-dashed border-gray-400/50 rounded-lg" style={{ width: TILE_WIDTH, height: TILE_HEIGHT }} />
        ))}
      </div>

      {/* 控制按钮 */}
      <div className="mt-8 flex gap-4">
        <button 
          onClick={restart}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow-lg active:scale-95 transition-all"
        >
          <RotateCcw size={20} /> 重置关卡
        </button>
      </div>

      {/* 游戏结束弹窗 */}
      {(status === 'won' || status === 'lost') && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-300">
            <div className="text-6xl mb-4">
              {status === 'won' ? '🎉' : '🪦'}
            </div>
            <h2 className="text-3xl font-black mb-2 text-gray-800">
              {status === 'won' ? '你赢了！' : '挑战失败'}
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              {status === 'won' 
                ? '太强了！你加入了羊群！' 
                : '槽位已满，下次一定能过！'}
            </p>
            <button 
              onClick={restart}
              className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow-xl active:scale-95 transition-all w-full justify-center"
            >
              <Play size={24} fill="currentColor" /> 再玩一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
