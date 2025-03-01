import React, { useState } from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

interface SideNavProps {
  items: NavItem[];
  activeItemId: string;
  onItemClick: (itemId: string) => void;
}

export function SideNav({ items, activeItemId, onItemClick }: SideNavProps) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);

  const handleMouseEnter = () => {
    if (!pinned) {
      setExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!pinned) {
      setExpanded(false);
    }
  };

  const togglePin = () => {
    setPinned(!pinned);
    // 如果取消固定且滑鼠不在導航欄上，則收起
    if (pinned) {
      setExpanded(false);
    } else {
      setExpanded(true);
    }
  };

  return (
    <div 
      className={`h-full bg-background border-r transition-all duration-300 ease-in-out ${expanded || pinned ? 'w-64' : 'w-16'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-4 flex justify-between items-center">
        <h2 className={`font-semibold truncate transition-opacity duration-300 ${expanded || pinned ? 'opacity-100' : 'opacity-0 w-0'}`}>
          NovelAI 工具
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setExpanded(!expanded)}
          className={`${expanded || pinned ? 'hidden' : 'block'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        {(expanded || pinned) && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePin}
            title={pinned ? "取消固定" : "固定選單"}
          >
            {pinned ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </Button>
        )}
      </div>
      
      <Separator />
      
      <nav className="mt-4">
        <ul className="space-y-1 px-2">
          {items.map((item) => (
            <li key={item.id}>
              <Button
                variant={activeItemId === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start ${expanded || pinned ? 'px-4 py-2' : 'p-2 justify-center'}`}
                onClick={() => onItemClick(item.id)}
                title={!expanded && !pinned ? item.label : undefined}
              >
                <span className={expanded || pinned ? "mr-3" : ""}>{item.icon}</span>
                {(expanded || pinned) && <span>{item.label}</span>}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}