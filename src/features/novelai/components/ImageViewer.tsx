import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';

interface ImageFile {
  path: string;
  name: string;
}

export function ImageViewer() {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [images, setImages] = useState<ImageFile[]>([]);

  const selectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '選擇圖片資料夾',
      });

      if (selected && typeof selected === 'string') {
        setSelectedPath(selected);
        await watchDirectory(selected);
        await loadImages(selected);
      }
    } catch (error) {
      console.error('選擇資料夾時發生錯誤:', error);
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
      const imageList = await invoke<ImageFile[]>('get_images', { path });
      setImages(imageList);
    } catch (error) {
      console.error('載入圖片時發生錯誤:', error);
    }
  };

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
      <div className="mb-4">
        <button
          onClick={selectDirectory}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          選擇圖片資料夾
        </button>
        {selectedPath && (
          <p className="mt-2 text-gray-600">
            當前資料夾: {selectedPath}
          </p>
        )}
      </div>

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
          此資料夾中沒有圖片
        </p>
      )}
    </div>
  );
}