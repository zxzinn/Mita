import { NovelAIGenerateImageRequest, NovelAIConfig, GenerateImageResult, GenerateImageOptions, NovelAIParameters, CharacterPrompt } from './types';
import { writeFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import JSZip from 'jszip';
import { modelConfigManager, ModelType } from './modelConfig';

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
      console.log('NovelAIService.generateImage 開始生成圖片');
      console.log('參數:', JSON.stringify(params, null, 2));
      console.log('選項:', JSON.stringify(options, null, 2));
      
      // 獲取模型類型
      const modelType = params.model as ModelType || 'nai-diffusion-3';
      
      // 提取字符提示（如果有）
      const characterPrompts: CharacterPrompt[] = params.parameters?.characterPrompts || [];
      
      // 根據模型調整參數
      const adaptedParameters = modelConfigManager.adaptParametersForModel(
        modelType,
        params.parameters || {},
        params.input || '',
        characterPrompts
      );
      
      // 確保所有必需的參數都存在
      const completeParameters: NovelAIParameters = {
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
        ...adaptedParameters
      };
      
      const request: NovelAIGenerateImageRequest = {
        input: params.input || '',
        model: modelType,
        action: 'generate',
        parameters: completeParameters
      };

      console.log('發送請求到 NovelAI API');
      console.log('API 端點:', this.config.apiEndpoint);
      console.log('授權金鑰長度:', this.config.authToken ? this.config.authToken.length : 0);
      console.log('調整後的參數:', JSON.stringify(request.parameters, null, 2));
      
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.authToken}`,
        },
        body: JSON.stringify(request)
      });

      console.log('收到 NovelAI API 響應');
      console.log('狀態碼:', response.status);
      console.log('狀態文本:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 錯誤響應:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      console.log('開始處理 API 響應');
      const buffer = await response.arrayBuffer();
      console.log('獲取到響應數據，大小:', buffer.byteLength);
      
      // 解壓縮 ZIP 檔案
      console.log('開始解壓縮 ZIP 檔案');
      const zip = new JSZip();
      await zip.loadAsync(buffer);
      
      // 取得第一個圖片檔案
      const files = Object.values(zip.files);
      console.log('ZIP 檔案中的文件數量:', files.length);
      
      const imageFile = files.find(file => !file.dir);
      if (!imageFile) {
        console.error('ZIP 檔案中沒有找到圖片文件');
        throw new Error('No image found in ZIP file');
      }
      
      console.log('找到圖片文件:', imageFile.name);

      // 將圖片轉換為 Uint8Array
      console.log('開始將圖片轉換為 Uint8Array');
      const imageData = await imageFile.async('uint8array');
      console.log('圖片數據大小:', imageData.byteLength);

      // 生成檔案名稱
      const fileName = this.generateFileName();
      console.log('生成的檔案名稱:', fileName);
      
      // 如果沒有指定儲存路徑，拋出錯誤
      if (!options.savePath) {
        console.error('沒有指定儲存路徑');
        throw new Error('No save path specified');
      }
      
      console.log('儲存路徑:', options.savePath);

      // 組合完整的檔案路徑
      console.log('開始組合完整的檔案路徑');
      const fullPath = await join(options.savePath, fileName);
      console.log('完整的檔案路徑:', fullPath);

      // 儲存圖片
      console.log('開始儲存圖片');
      await writeFile(fullPath, imageData);
      console.log('圖片儲存成功');

      return {
        success: true,
        imagePath: fullPath
      };
    } catch (error) {
      console.error('生成圖片時發生錯誤:', error);
      
      if (error instanceof Error) {
        console.error('錯誤訊息:', error.message);
        console.error('錯誤堆疊:', error.stack);
      } else {
        console.error('未知錯誤類型:', typeof error);
        console.error('錯誤內容:', JSON.stringify(error));
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}