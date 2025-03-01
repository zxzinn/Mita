import { useState } from 'react';
import { ImageGenerator } from './features/novelai/components/ImageGenerator';
import { ImageViewer } from './features/novelai/components/ImageViewer';
import { NovelAIConfig } from './features/novelai/types';
import { SideNav, NavItem } from './components/SideNav';

// 簡單的圖標組件
const ImageGeneratorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ImageViewerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// 導航項目定義
const navItems: NavItem[] = [
  {
    id: 'generator',
    label: '圖片生成器',
    icon: <ImageGeneratorIcon />,
  },
  {
    id: 'viewer',
    label: '圖片預覽',
    icon: <ImageViewerIcon />,
  },
  {
    id: 'settings',
    label: '設定',
    icon: <SettingsIcon />,
  },
];

function App() {
  const [config, setConfig] = useState<NovelAIConfig>({
    apiEndpoint: 'https://image.novelai.net/ai/generate-image',
    authToken: ''
  });

  const [activeNavItem, setActiveNavItem] = useState<string>('generator');
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfig(false);
  };

  const handleNavItemClick = (itemId: string) => {
    if (itemId === 'settings') {
      setShowConfig(true);
    } else {
      setActiveNavItem(itemId);
    }
  };

  if (showConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-foreground mb-6">NovelAI 設定</h1>
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="authToken" 
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                授權金鑰
              </label>
              <input
                id="authToken"
                type="password"
                value={config.authToken}
                onChange={(e) => setConfig(prev => ({ ...prev, authToken: e.target.value }))}
                className="w-full p-2 border border-input rounded-md"
                placeholder="輸入你的 NovelAI 授權金鑰"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-md text-white font-medium bg-primary hover:bg-primary/90"
              >
                確認
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 rounded-md text-foreground font-medium border border-input hover:bg-accent"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* 側邊導航欄 */}
      <SideNav 
        items={navItems} 
        activeItemId={activeNavItem} 
        onItemClick={handleNavItemClick} 
      />

      {/* 主要內容區域 */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-foreground">
                {activeNavItem === 'generator' ? 'NovelAI 圖片生成器' : '圖片預覽'}
              </h1>
              <button
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md"
              >
                設定 API 金鑰
              </button>
            </div>

            <div className="bg-card rounded-lg shadow-md">
              <div className="p-6">
                {activeNavItem === 'generator' ? (
                  <ImageGenerator config={config} />
                ) : (
                  <ImageViewer />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
