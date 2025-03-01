import { NovelAIParameters, CharacterPrompt, V4Prompt } from './types';

// 模型類型
export type ModelType = 'nai-diffusion-4-full' | 'nai-diffusion-3' | 'nai-diffusion-2' | 'safe-diffusion';

// 基本默認參數（所有模型共用的基礎參數）
const baseDefaultParameters: Partial<NovelAIParameters> = {
  params_version: 3,
  width: 832,
  height: 1216,
  scale: 5,
  sampler: 'k_euler_ancestral',
  steps: 23,
  n_samples: 1,
  ucPreset: 0,
  qualityToggle: true,
  dynamic_thresholding: false,
  controlnet_strength: 1,
  legacy: false,
  add_original_image: true,
  cfg_rescale: 0,
  noise_schedule: 'karras',
  legacy_v3_extend: false,
  skip_cfg_above_sigma: null,
  characterPrompts: [],  // 空數組作為默認值
  reference_image_multiple: [],
  reference_information_extracted_multiple: [],
  reference_strength_multiple: [],
  deliberate_euler_ancestral_bug: false,
  prefer_brownian: true,
};

// NAI-3 特定默認參數
const nai3DefaultParameters: Partial<NovelAIParameters> = {
  ...baseDefaultParameters,
  scale: 5,
  sm: false,
  sm_dyn: false,
  negative_prompt: "nsfw, lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]",
};

// NAI-4 特定默認參數
const nai4DefaultParameters: Partial<NovelAIParameters> = {
  ...baseDefaultParameters,
  scale: 6,
  negative_prompt: "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks",
  use_coords: false,
};

// 模型配置管理器
class ModelConfigManager {
  // 獲取模型的默認參數
  getDefaultParameters(model: ModelType): Partial<NovelAIParameters> {
    switch (model) {
      case 'nai-diffusion-4-full':
        return { ...nai4DefaultParameters };
      case 'nai-diffusion-3':
      case 'nai-diffusion-2':
      case 'safe-diffusion':
      default:
        return { ...nai3DefaultParameters };
    }
  }

  // 根據模型和當前參數，生成適合該模型的參數
  adaptParametersForModel(model: ModelType, currentParams: Partial<NovelAIParameters>, prompt: string, characterPrompts: CharacterPrompt[]): Partial<NovelAIParameters> {
    const defaultParams = this.getDefaultParameters(model);
    const adaptedParams = { ...defaultParams, ...currentParams };

    // 針對NAI-4模型，添加特殊欄位
    if (model === 'nai-diffusion-4-full') {
      // 創建v4_prompt結構
      adaptedParams.v4_prompt = this.createV4Prompt(prompt, characterPrompts);
      
      // 創建v4_negative_prompt結構
      adaptedParams.v4_negative_prompt = this.createV4NegativePrompt(adaptedParams.negative_prompt || '', characterPrompts);
      
      // 設置use_coords和use_order
      adaptedParams.use_coords = false;
      
      // 確保characterPrompts存在
      if (!adaptedParams.characterPrompts || !Array.isArray(adaptedParams.characterPrompts)) {
        adaptedParams.characterPrompts = [];
      }
    } else {
      // 對於非NAI-4模型，移除NAI-4特有欄位
      delete adaptedParams.v4_prompt;
      delete adaptedParams.v4_negative_prompt;
      delete adaptedParams.use_coords;
      
      // 確保characterPrompts為空數組
      adaptedParams.characterPrompts = [];
    }

    return adaptedParams;
  }

  // 創建V4Prompt結構
  private createV4Prompt(basePrompt: string, characterPrompts: CharacterPrompt[]): V4Prompt {
    return {
      caption: {
        base_caption: basePrompt,
        char_captions: characterPrompts.map(cp => ({
          char_caption: cp.prompt,
          centers: cp.center ? [cp.center] : [{ x: 0, y: 0 }]
        }))
      },
      use_coords: false,
      use_order: true
    };
  }

  // 創建V4NegativePrompt結構
  private createV4NegativePrompt(negativePrompt: string, characterPrompts: CharacterPrompt[]): V4Prompt {
    return {
      caption: {
        base_caption: negativePrompt,
        char_captions: characterPrompts.map(() => ({
          char_caption: "",
          centers: [{ x: 0, y: 0 }]
        }))
      }
    };
  }
}

// 導出單例實例
export const modelConfigManager = new ModelConfigManager();