import { useState } from 'react';
import { NovelAIService } from '../api';
import { NovelAIConfig, NovelAIParameters } from '../types';
import { DEFAULT_PARAMETERS } from '../constants';

interface ImageGeneratorProps {
  config: NovelAIConfig;
}

export function ImageGenerator({ config }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parameters, setParameters] = useState<NovelAIParameters>(DEFAULT_PARAMETERS);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const novelAI = new NovelAIService(config);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const result = await novelAI.generateImage({
        input: prompt,
        parameters: {
          ...parameters,
          seed: parameters.seed || Math.floor(Math.random() * 999999999)
        }
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

  const handleParameterChange = (key: keyof NovelAIParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
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

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? '隱藏進階設定' : '顯示進階設定'}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  寬度
                </label>
                <input
                  type="number"
                  value={parameters.width}
                  onChange={(e) => handleParameterChange('width', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="64"
                  max="1024"
                  step="64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  高度
                </label>
                <input
                  type="number"
                  value={parameters.height}
                  onChange={(e) => handleParameterChange('height', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="64"
                  max="1024"
                  step="64"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                採樣器
              </label>
              <select
                value={parameters.sampler}
                onChange={(e) => handleParameterChange('sampler', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="k_euler_ancestral">k_euler_ancestral</option>
                <option value="k_euler">k_euler</option>
                <option value="ddim">ddim</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                步數
              </label>
              <input
                type="number"
                value={parameters.steps}
                onChange={(e) => handleParameterChange('steps', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                種子
              </label>
              <input
                type="number"
                value={parameters.seed}
                onChange={(e) => handleParameterChange('seed', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="留空為隨機"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                負面提示詞
              </label>
              <textarea
                value={parameters.negative_prompt}
                onChange={(e) => handleParameterChange('negative_prompt', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className={`
            w-full px-4 py-2 rounded-md text-white font-medium
            ${isLoading || !prompt.trim() 
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