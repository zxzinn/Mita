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
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);

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

  const handleImageClick = (image: ImageFile) => {
    setSelectedImage(image);
  };

  const closePreview = () => {
    setSelectedImage(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 頂部信息欄 */}
      <div className="p-4 flex justify-between items-center border-b">
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

      {/* 主要內容區域 */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500">載入中...</p>
            </div>
          </div>
        ) : (
          <>
            {images.length === 0 && selectedPath ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">此資料夾中沒有圖片</p>
                  <p className="text-sm text-gray-400 mt-2">請先生成一些圖片</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleImageClick(image)}
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
            )}
          </>
        )}
      </div>

      {/* 圖片預覽模態框 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={closePreview}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={convertFileSrc(selectedImage.path)}
              alt={selectedImage.name}
              className="max-w-full max-h-[90vh] object-contain bg-gray-900 rounded-lg"
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={closePreview}
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 text-center">
              {selectedImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}