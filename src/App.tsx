import { useState } from 'react';
import { ImageGenerator } from './features/novelai/components/ImageGenerator';
import { ImageViewer } from './features/novelai/components/ImageViewer';
import { NovelAIConfig } from './features/novelai/types';

function App() {
  const [config, setConfig] = useState<NovelAIConfig>({
    apiEndpoint: 'https://image.novelai.net/ai/generate-image',
    authToken: ''
  });

  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfig(false);
  };

  if (showConfig) {
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
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
              >
                確認
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">NovelAI 圖片生成器</h1>
                <button
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  設定 API 金鑰
                </button>
              </div>
              <ImageGenerator config={config} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">圖片預覽</h2>
                <p className="text-gray-600 mt-1">查看生成的圖片</p>
              </div>
              <ImageViewer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
