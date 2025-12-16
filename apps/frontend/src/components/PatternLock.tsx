import React, { useState, useEffect, useRef } from 'react';

interface PatternLockProps {
  onPatternComplete?: (pattern: string) => void;
  initialPattern?: string;
  readOnly?: boolean;
}

const PatternLock: React.FC<PatternLockProps> = ({ onPatternComplete, initialPattern = "", readOnly = false }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Parse initial string "1-2-3" to array [1,2,3]
  useEffect(() => {
    if (initialPattern) {
      const parts = initialPattern.split('-').map(Number).filter(n => !isNaN(n));
      setPattern(parts);
    }
  }, [initialPattern]);

  // Node coordinates (3x3 grid)
  const nodes = [
    { id: 1, x: 20, y: 20 }, { id: 2, x: 50, y: 20 }, { id: 3, x: 80, y: 20 },
    { id: 4, x: 20, y: 50 }, { id: 5, x: 50, y: 50 }, { id: 6, x: 80, y: 50 },
    { id: 7, x: 20, y: 80 }, { id: 8, x: 50, y: 80 }, { id: 9, x: 80, y: 80 },
  ];

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Scale to 0-100 coordinate system
    const scaleX = 100 / rect.width;
    const scaleY = 100 / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (id: number) => {
    if (readOnly) return;
    setIsDrawing(true);
    setPattern([id]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault(); // Prevent scroll on touch
    
    const point = getPointFromEvent(e);
    
    // Check collision with any node
    nodes.forEach(node => {
      const distance = Math.sqrt(Math.pow(point.x - node.x, 2) + Math.pow(point.y - node.y, 2));
      if (distance < 10) { // Hit radius
        if (!pattern.includes(node.id)) {
          setPattern(prev => [...prev, node.id]);
        }
      }
    });
  };

  const handleEnd = () => {
    if (readOnly) return;
    setIsDrawing(false);
    if (onPatternComplete) {
      onPatternComplete(pattern.join('-'));
    }
  };

  // Generate path string
  const getPath = () => {
    if (pattern.length === 0) return "";
    const firstNode = nodes.find(n => n.id === pattern[0]);
    if (!firstNode) return "";
    
    let d = `M ${firstNode.x} ${firstNode.y}`;
    for (let i = 1; i < pattern.length; i++) {
      const node = nodes.find(n => n.id === pattern[i]);
      if (node) d += ` L ${node.x} ${node.y}`;
    }
    return d;
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-48 h-48 bg-gray-100 dark:bg-slate-700 rounded-xl relative touch-none select-none border-2 border-gray-200 dark:border-slate-600"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
        onMouseLeave={handleEnd}
      >
        <svg ref={svgRef} viewBox="0 0 100 100" className="w-full h-full pointer-events-none">
          {/* Connection Lines */}
          <path 
            d={getPath()} 
            fill="none" 
            stroke={readOnly ? "#3b82f6" : "#10b981"} 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="opacity-80"
          />
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const isActive = pattern.includes(node.id);
          const isLast = pattern[pattern.length - 1] === node.id;
          
          return (
            <div
              key={node.id}
              onMouseDown={() => handleStart(node.id)}
              onTouchStart={() => handleStart(node.id)}
              className={`absolute w-4 h-4 rounded-full -ml-2 -mt-2 transition-all duration-200 z-10 pointer-events-auto cursor-pointer ${
                isActive 
                  ? (readOnly ? 'bg-blue-500 scale-125' : 'bg-green-500 scale-125') 
                  : 'bg-gray-400 dark:bg-slate-500 hover:bg-gray-500'
              } ${isLast && !readOnly ? 'ring-4 ring-green-500/30' : ''}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            />
          );
        })}
      </div>
      {!readOnly && (
        <div className="mt-2 flex gap-2">
           <button 
             onClick={() => setPattern([])}
             className="text-xs text-red-500 hover:underline"
             type="button"
           >
             Temizle
           </button>
        </div>
      )}
    </div>
  );
};

export default PatternLock;