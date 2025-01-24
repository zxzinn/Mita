import { NovelAIGenerateImageRequest, NovelAIConfig, GenerateImageResult } from './types';
import { writeFile, BaseDirectory, createDir } from '@tauri-apps/plugin-fs';
import JSZip from 'jszip';

export class NovelAIService {
  private config: NovelAIConfig;

  constructor(config: NovelAIConfig) {
    this.config = config;
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await createDir('novelai-output', {
        dir: BaseDirectory.AppData,
        recursive: true
      });
    } catch (error) {
      // Directory might already exist, which is fine
      console.log('Directory already exists or creation failed:', error);
    }
  }

  private generateFileName(): string {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    return `novelai-${timestamp}.png`;
  }

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
      
      // 使用 Tauri 的 dialog API 來選擇儲存位置
      const savePath = await save({
        filters: [{
          name: 'Image',
          extensions: ['png']
        }]
      });

      if (!savePath) {
        throw new Error('Save operation cancelled');
      }

      // 將圖片儲存到檔案系統
      await writeFile(savePath, new Uint8Array(buffer), { append: false });

      return {
        success: true,
        imagePath: savePath
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