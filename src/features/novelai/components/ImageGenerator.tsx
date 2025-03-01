import { useState, useEffect } from 'react';
import { NovelAIService } from '../api';
import { NovelAIConfig, NovelAIParameters } from '../types';
import { convertFileSrc } from '@tauri-apps/api/core';
import { invoke } from '@tauri-apps/api/core';

interface ImageGeneratorProps {
  config: NovelAIConfig;
}

const MODEL_OPTIONS = [
  'nai-diffusion-4-full',
  'nai-diffusion-3',
  'nai-diffusion-2',
  'safe-diffusion'
] as const;

const ACTION_OPTIONS = [
  'generate',
  'img2img',
  'inpaint'
] as const;

const SAMPLER_OPTIONS = [
  'k_euler_ancestral',
  'k_euler',
  'k_dpmpp_2m',
  'k_dpmpp_sde',
  'k_dpm_2',
  'k_dpm_2_ancestral',
  'k_dpmpp_2s_ancestral'
] as const;

const NOISE_SCHEDULE_OPTIONS = [
  'karras',
  'exponential',
  'polyexponential'
] as const;

const DEFAULT_PARAMETERS: NovelAIParameters = {
  params_version: 3,
  width: 832,
  height: 1216,
  scale: 5,
  sampler: 'k_euler_ancestral',
  steps: 23,
  seed: Math.floor(Math.random() * 999999999),
  n_samples: 1,
  ucPreset: 0,
  qualityToggle: true,
  sm: false,
  sm_dyn: false,
  dynamic_thresholding: false,
  controlnet_strength: 1,
  legacy: false,
  add_original_image: true,
  cfg_rescale: 0,
  noise_schedule: 'karras',
  legacy_v3_extend: false,
  skip_cfg_above_sigma: null,
  characterPrompts: [],
  negative_prompt: "nsfw, lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]",
  reference_image_multiple: [],
  reference_information_extracted_multiple: [],
  reference_strength_multiple: [],
  deliberate_euler_ancestral_bug: false,
  prefer_brownian: true,
};

export function ImageGenerator({ config }: ImageGeneratorProps) {
  // 基本參數
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_PARAMETERS.negative_prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [savePath, setSavePath] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; imagePath?: string } | null>(null);

  // 生成參數
  const [action, setAction] = useState<string>('generate');
  const [model, setModel] = useState<string>('nai-diffusion-3');
  const [width, setWidth] = useState(DEFAULT_PARAMETERS.width);
  const [height, setHeight] = useState(DEFAULT_PARAMETERS.height);
  const [scale, setScale] = useState(DEFAULT_PARAMETERS.scale);
  const [sampler, setSampler] = useState(DEFAULT_PARAMETERS.sampler);
  const [steps, setSteps] = useState(DEFAULT_PARAMETERS.steps);
  const [seed, setSeed] = useState<number | null>(null);
  const [cfgRescale, setCfgRescale] = useState(DEFAULT_PARAMETERS.cfg_rescale);
  const [noiseSchedule, setNoiseSchedule] = useState(DEFAULT_PARAMETERS.noise_schedule);
  const [qualityToggle, setQualityToggle] = useState(DEFAULT_PARAMETERS.qualityToggle);
  const [sm, setSm] = useState(DEFAULT_PARAMETERS.sm);
  const [smDyn, setSmDyn] = useState(DEFAULT_PARAMETERS.sm_dyn);
  const [undesiredContent, setUndesiredContent] = useState(DEFAULT_PARAMETERS.ucPreset);

  const novelAI = new NovelAIService(config);

  // 獲取應用程序圖片目錄
  const getAppImageDir = async () => {
    try {
      console.log('正在獲取應用程序圖片目錄...');
      const appImageDir = await invoke<string>('get_app_image_dir');
      console.log('獲取應用程序圖片目錄成功:', appImageDir);
      setSavePath(appImageDir);
      return appImageDir;
    } catch (error) {
      console.error('獲取應用程序圖片目錄時發生錯誤:', error);
      if (error instanceof Error) {
        console.error('錯誤訊息:', error.message);
        console.error('錯誤堆疊:', error.stack);
      } else {
        console.error('未知錯誤類型:', typeof error);
        console.error('錯誤內容:', JSON.stringify(error));
      }
      return null;
    }
  };

  useEffect(() => {
    // 獲取應用程序圖片目錄
    getAppImageDir();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      console.log('開始生成圖片...');
      
      // 如果沒有保存路徑，則獲取應用程序圖片目錄
      const currentSavePath = savePath || await getAppImageDir();
      if (!currentSavePath) {
        throw new Error('無法獲取保存路徑');
      }
      
      console.log('使用保存路徑:', currentSavePath);

      const parameters: NovelAIParameters = {
        ...DEFAULT_PARAMETERS,
        width,
        height,
        scale,
        sampler,
        steps,
        seed: seed ?? Math.floor(Math.random() * 999999999),
        ucPreset: undesiredContent,
        qualityToggle,
        sm,
        sm_dyn: smDyn,
        cfg_rescale: cfgRescale,
        noise_schedule: noiseSchedule,
        negative_prompt: negativePrompt,
      };

      console.log('調用NovelAI API生成圖片...');
      const result = await novelAI.generateImage({
        input: prompt,
        model,
        action: action as 'generate',
        parameters
      }, {
        savePath: currentSavePath
      });

      console.log('NovelAI API返回結果:', result);

      if (result.success) {
        setResult({
          success: true,
          message: `圖片已生成成功`,
          imagePath: result.imagePath
        });
      } else {
        console.error('生成圖片失敗:', result.error);
        setResult({
          success: false,
          message: result.error || '生成圖片時發生錯誤'
        });
      }
    } catch (error) {
      console.error('生成圖片時發生異常:', error);
      if (error instanceof Error) {
        console.error('錯誤訊息:', error.message);
        console.error('錯誤堆疊:', error.stack);
      } else {
        console.error('未知錯誤類型:', typeof error);
        console.error('錯誤內容:', JSON.stringify(error));
      }
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '發生未知錯誤'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999999));
  };

  // 檢查是否設置了授權金鑰
  const isApiKeySet = !!config.authToken;

  return (
    <div className="flex h-full">
      {/* API 金鑰未設置的提示 */}
      {!isApiKeySet && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">尚未設置 API 金鑰</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>請點擊頁面上方的「設定 API 金鑰」按鈕來設置您的 NovelAI 授權金鑰，才能使用圖片生成功能。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 左側面板：提示詞和控制區域 */}
      <div className="w-1/4 h-full p-4 overflow-y-auto flex flex-col">
        <div className="space-y-4 flex-1">
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
              rows={6}
              placeholder="輸入圖片生成提示詞..."
              disabled={isLoading || !isApiKeySet}
            />
          </div>

          <div>
            <label 
              htmlFor="negativePrompt" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              反向提示詞
            </label>
            <textarea
              id="negativePrompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              rows={4}
              placeholder="輸入反向提示詞..."
              disabled={isLoading || !isApiKeySet}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模型
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                disabled={isLoading || !isApiKeySet}
              >
                {MODEL_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                動作
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                disabled={isLoading || !isApiKeySet}
              >
                {ACTION_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                寬度
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                min="64"
                max="1024"
                step="64"
                disabled={isLoading || !isApiKeySet}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                高度
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                min="64"
                max="1024"
                step="64"
                disabled={isLoading || !isApiKeySet}
              />
            </div>
          </div>
        </div>

        {/* 底部控制區域 */}
        <div className="mt-4 space-y-4">
          {savePath && (
            <p className="text-sm text-gray-600">
              圖片將儲存至應用程式專屬資料夾
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim() || !savePath || !isApiKeySet}
            className={`
              w-full px-4 py-2 rounded-md text-white font-medium
              ${isLoading || !prompt.trim() || !savePath || !isApiKeySet
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {isLoading ? '生成中...' : '生成圖片'}
          </button>

          {result && (
            <div 
              className={`p-4 rounded-md ${
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {result.message}
            </div>
          )}
        </div>
      </div>

      {/* 中間預覽區域 - 使用固定高度和寬度 */}
      <div className="flex-1 h-full p-4 flex items-center justify-center">
        {/* 固定大小的預覽容器 */}
        <div className="w-[500px] h-[500px] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {result?.imagePath ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={convertFileSrc(result.imagePath)}
                alt="生成的圖片"
                className="max-w-full max-h-full object-contain"
              />
              <button 
                className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-opacity"
                onClick={() => {
                  if (result.imagePath) {
                    // 在新窗口中打開圖片
                    window.open(convertFileSrc(result.imagePath), '_blank');
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-center p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>圖片預覽區域</p>
              <p className="text-sm mt-2">生成圖片後將顯示在此處</p>
            </div>
          )}
        </div>
      </div>

      {/* 右側參數區域 */}
      <div className="w-1/4 h-full p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              採樣器
            </label>
            <select
              value={sampler}
              onChange={(e) => setSampler(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={isLoading || !isApiKeySet}
            >
              {SAMPLER_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              雜訊排程
            </label>
            <select
              value={noiseSchedule}
              onChange={(e) => setNoiseSchedule(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={isLoading || !isApiKeySet}
            >
              {NOISE_SCHEDULE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              提示詞相關度 ({scale})
            </label>
            <input
              type="range"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
              min="1"
              max="100"
              disabled={isLoading || !isApiKeySet}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              步數 ({steps})
            </label>
            <input
              type="range"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full"
              min="1"
              max="50"
              disabled={isLoading || !isApiKeySet}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CFG Rescale
            </label>
            <input
              type="number"
              value={cfgRescale}
              onChange={(e) => setCfgRescale(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              step="0.05"
              disabled={isLoading || !isApiKeySet}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              不良內容過濾 (0-3)
            </label>
            <input
              type="number"
              value={undesiredContent}
              onChange={(e) => setUndesiredContent(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              min="0"
              max="3"
              disabled={isLoading || !isApiKeySet}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種子碼
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={seed ?? ''}
                onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm"
                min="0"
                max="999999999"
                placeholder="隨機"
                disabled={isLoading || !isApiKeySet}
              />
              <button
                type="button"
                onClick={handleRandomSeed}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md"
                disabled={isLoading || !isApiKeySet}
              >
                🎲
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={qualityToggle}
                onChange={(e) => setQualityToggle(e.target.checked)}
                disabled={isLoading || !isApiKeySet}
              />
              <span className="text-sm text-gray-700">品質優化</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sm}
                onChange={(e) => setSm(e.target.checked)}
                disabled={isLoading || !isApiKeySet}
              />
              <span className="text-sm text-gray-700">SM</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={smDyn}
                onChange={(e) => setSmDyn(e.target.checked)}
                disabled={isLoading || !isApiKeySet}
              />
              <span className="text-sm text-gray-700">SM Dyn</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}