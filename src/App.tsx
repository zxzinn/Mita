import { useState } from 'react';
import { ImageGenerator } from './features/novelai/components/ImageGenerator';
import { NovelAIConfig } from './features/novelai/types';

function App() {
  const [config, setConfig] = useState<NovelAIConfig>({
    apiEndpoint: 'https://image.novelai.net/ai/generate-image',
    authToken: ''
  });

  const [isConfigured, setIsConfigured] = useState(false);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigured(true);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">NovelAI 設定</h1>
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="authToken" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                授權金鑰
              </label>
              <input
                id="authToken"
                type="password"
                value={config.authToken}
                onChange={(e) => setConfig(prev => ({ ...prev, authToken: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="輸入你的 NovelAI 授權金鑰"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!config.authToken}
              className={`
                w-full px-4 py-2 rounded-md text-white font-medium
                ${!config.authToken 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              確認
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">NovelAI 圖片生成器</h1>
              <button
                onClick={() => setIsConfigured(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                修改設定
              </button>
            </div>
            <ImageGenerator config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
