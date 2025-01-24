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
  sm: boolean;
  sm_dyn: boolean;
  dynamic_thresholding: boolean;
  controlnet_strength: number;
  legacy: boolean;
  add_original_image: boolean;
  cfg_rescale: number;
  noise_schedule: string;
  legacy_v3_extend: boolean;
  skip_cfg_above_sigma: null;
  characterPrompts: string[];
  negative_prompt: string;
  reference_image_multiple: string[];
  reference_information_extracted_multiple: any[];
  reference_strength_multiple: number[];
  deliberate_euler_ancestral_bug: boolean;
  prefer_brownian: boolean;
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