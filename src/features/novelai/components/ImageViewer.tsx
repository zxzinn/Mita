import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';

interface ImageFile {
  path: string;
  name: string;
}

export function ImageViewer() {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 獲取應用程序圖片目錄
  const getAppImageDir = async () => {
    try {
      const appImageDir = await invoke<string>('get_app_image_dir');
      return appImageDir;
    } catch (error) {
      console.error('獲取應用程序圖片目錄時發生錯誤:', error);
      return null;
    }
  };

  const watchDirectory = async (path: string) => {
    try {
      await invoke('watch_directory', { path });
    } catch (error) {
      console.error('監控資料夾時發生錯誤:', error);
    }
  };

  const loadImages = async (path: string) => {
    try {
      setIsLoading(true);
      const imageList = await invoke<ImageFile[]>('get_images', { path });
      setImages(imageList);
    } catch (error) {
      console.error('載入圖片時發生錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化時自動獲取應用程序圖片目錄並加載圖片
  useEffect(() => {
    const initializeViewer = async () => {
      const appImageDir = await getAppImageDir();
      if (appImageDir) {
        setSelectedPath(appImageDir);
        await watchDirectory(appImageDir);
        await loadImages(appImageDir);
      }
    };

    initializeViewer();
  }, []);

  useEffect(() => {
    const unsubscribe = listen('directory-changed', async () => {
      if (selectedPath) {
        await loadImages(selectedPath);
      }
    });

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, [selectedPath]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">應用程式圖片資料夾</h3>
          {selectedPath && (
            <p className="mt-1 text-sm text-gray-600">
              所有生成的圖片都會自動儲存在此資料夾
            </p>
          )}
        </div>
        {selectedPath && (
          <p className="text-sm text-gray-500">
            共 {images.length} 張圖片
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">載入中...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={convertFileSrc(image.path)}
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.name}
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && selectedPath && (
            <p className="text-center text-gray-500 mt-8">
              此資料夾中沒有圖片，請先生成一些圖片
            </p>
          )}
        </>
      )}
    </div>
  );
}