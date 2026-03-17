const MAX_WIDTH = 400;
const AVATAR_MAX_SIZE = 200;
const JPEG_QUALITY = 0.78;

function compressToDataUrl(
  file: File,
  maxSize: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러올 수 없어요.'));
    };
    img.src = url;
  });
}

/**
 * 이미지 파일을 리사이즈·압축해 data URL로 반환 (Firestore 저장용 크기 제한 고려).
 */
export function compressImageToDataUrl(file: File): Promise<string> {
  return compressToDataUrl(file, MAX_WIDTH);
}

/**
 * 프로필/아바타용 작은 이미지로 압축해 data URL 반환.
 */
export function compressImageToDataUrlForAvatar(file: File): Promise<string> {
  return compressToDataUrl(file, AVATAR_MAX_SIZE);
}
