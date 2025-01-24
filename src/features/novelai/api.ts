import { NovelAIGenerateImageRequest, NovelAIConfig, GenerateImageResult, GenerateImageOptions } from './types';
import { writeFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import JSZip from 'jszip';

export class NovelAIService {
  private config: NovelAIConfig;

  constructor(config: NovelAIConfig) {
    this.config = config;
  }

  private generateFileName(): string {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    return `novelai-${timestamp}.png`;
  }

  async generateImage(
    params: Partial<NovelAIGenerateImageRequest>,
    options: GenerateImageOptions = {}
  ): Promise<GenerateImageResult> {
    try {
      const request: NovelAIGenerateImageRequest = {
        input: params.input || '',
        model: params.model || 'nai-diffusion-3',
        action: 'generate',
        parameters: {
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
          ...params.parameters
        }
      };

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.authToken}`,
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      
      // 解壓縮 ZIP 檔案
      const zip = new JSZip();
      await zip.loadAsync(buffer);
      
      // 取得第一個圖片檔案
      const files = Object.values(zip.files);
      const imageFile = files.find(file => !file.dir);
      if (!imageFile) {
        throw new Error('No image found in ZIP file');
      }

      // 將圖片轉換為 Uint8Array
      const imageData = await imageFile.async('uint8array');

      // 生成檔案名稱
      const fileName = this.generateFileName();
      
      // 如果沒有指定儲存路徑，拋出錯誤
      if (!options.savePath) {
        throw new Error('No save path specified');
      }

      // 組合完整的檔案路徑
      const fullPath = await join(options.savePath, fileName);

      // 儲存圖片
      await writeFile(fullPath, imageData);

      return {
        success: true,
        imagePath: fullPath
      };
    } catch (error) {
      console.error('Error generating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}