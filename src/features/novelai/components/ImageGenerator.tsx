import { useState, useEffect } from 'react';
import { NovelAIService } from '../api';
import { NovelAIConfig, NovelAIParameters } from '../types';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';

interface ImageGeneratorProps {
  config: NovelAIConfig;
}

const SAVE_PATH_KEY = 'novelai-save-path';

const MODEL_OPTIONS = [
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

      const result = await novelAI.generateImage({
        input: prompt,
        model,
        action: action as 'generate',
        parameters
      }, {
        savePath: savePath || undefined
      });

      if (result.success) {
        setResult({
          success: true,
          message: `圖片已儲存至: ${result.imagePath}`,
          imagePath: result.imagePath
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

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999999));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 上方提示詞區域 */}
      <div className="w-full p-4 space-y-4">
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
            rows={3}
            placeholder="輸入圖片生成提示詞..."
            disabled={isLoading}
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
            rows={2}
            placeholder="輸入反向提示詞..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex flex-1 p-4 gap-4">
        {/* 左側參數 */}
        <div className="w-1/4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={isLoading}
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
              disabled={isLoading}
            >
              {ACTION_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              採樣器
            </label>
            <select
              value={sampler}
              onChange={(e) => setSampler(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={isLoading}
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
              disabled={isLoading}
            >
              {NOISE_SCHEDULE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 中間預覽區域 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
          {result?.imagePath ? (
            <img
              src={convertFileSrc(result.imagePath)}
              alt="生成的圖片"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400">圖片預覽區域</div>
          )}
        </div>

        {/* 右側參數 */}
        <div className="w-1/4 space-y-4">
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleRandomSeed}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md"
                disabled={isLoading}
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
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">品質優化</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sm}
                onChange={(e) => setSm(e.target.checked)}
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">SM</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={smDyn}
                onChange={(e) => setSmDyn(e.target.checked)}
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">SM Dyn</span>
            </label>
          </div>
        </div>
      </div>

      {/* 底部控制區域 */}
      <div className="p-4 space-y-4">
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
          onClick={handleSubmit}
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
    </div>
  );
}