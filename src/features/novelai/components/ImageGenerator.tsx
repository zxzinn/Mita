import { useState, useEffect } from 'react';
import { NovelAIService } from '../api';
import { NovelAIConfig } from '../types';
import { open } from '@tauri-apps/plugin-dialog';

interface ImageGeneratorProps {
  config: NovelAIConfig;
}

const SAVE_PATH_KEY = 'novelai-save-path';

export function ImageGenerator({ config }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savePath, setSavePath] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const novelAI = new NovelAIService(config);

  // 載入儲存的路徑
  useEffect(() => {
    const savedPath = localStorage.getItem(SAVE_PATH_KEY);
    if (savedPath) {
      setSavePath(savedPath);
    }
  }, []);

  const handleSelectFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: '選擇儲存資料夾'
      });

      if (selectedPath) {
        setSavePath(selectedPath as string);
        localStorage.setItem(SAVE_PATH_KEY, selectedPath as string);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const result = await novelAI.generateImage({
        input: prompt
      }, {
        savePath: savePath || undefined
      });

      if (result.success) {
        setResult({
          success: true,
          message: `圖片已儲存至: ${result.imagePath}`
        });
      } else {
        setResult({
          success: false,
          message: result.error || '生成圖片時發生錯誤'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '發生未知錯誤'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="prompt" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            提示詞
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            rows={4}
            placeholder="輸入圖片生成提示詞..."
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <p className="text-sm text-gray-600">
              儲存位置: {savePath || '尚未選擇'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSelectFolder}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            選擇資料夾
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim() || !savePath}
          className={`
            w-full px-4 py-2 rounded-md text-white font-medium
            ${isLoading || !prompt.trim() || !savePath
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {isLoading ? '生成中...' : '生成圖片'}
        </button>
      </form>

      {result && (
        <div 
          className={`mt-4 p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}