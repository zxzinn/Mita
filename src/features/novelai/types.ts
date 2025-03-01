export interface NovelAIGenerateImageRequest {
  input: string;
  model: string;
  action: 'generate';
  parameters: NovelAIParameters;
}

export interface NovelAIParameters {
  params_version: number;
  width: number;
  height: number;
  scale: number;
  sampler: string;
  steps: number;
  seed: number;
  n_samples: number;
  ucPreset: number;
  qualityToggle: boolean;
  sm?: boolean;
  sm_dyn?: boolean;
  dynamic_thresholding: boolean;
  controlnet_strength: number;
  legacy: boolean;
  add_original_image: boolean;
  cfg_rescale: number;
  noise_schedule: string;
  legacy_v3_extend: boolean;
  skip_cfg_above_sigma: null;
  characterPrompts: CharacterPrompt[];  // NAI-4特有，但保留為必需字段，在API中會提供默認空數組
  negative_prompt: string;
  reference_image_multiple: string[];
  reference_information_extracted_multiple: any[];
  reference_strength_multiple: number[];
  deliberate_euler_ancestral_bug: boolean;
  prefer_brownian: boolean;
  // NAI-4 特有欄位
  v4_prompt?: V4Prompt;
  v4_negative_prompt?: V4Prompt;
  use_coords?: boolean;
}

export interface CharacterPrompt {
  prompt: string;
  uc?: string;
  center?: {
    x: number;
    y: number;
  };
}

export interface V4Prompt {
  caption: {
    base_caption: string;
    char_captions: {
      char_caption: string;
      centers: {
        x: number;
        y: number;
      }[];
    }[];
  };
  use_coords?: boolean;
  use_order?: boolean;
}

export interface NovelAIConfig {
  apiEndpoint: string;
  authToken: string;
}

export interface GenerateImageOptions {
  savePath?: string;  // 儲存路徑
}

export interface GenerateImageResult {
  success: boolean;
  imagePath?: string;
  error?: string;
}