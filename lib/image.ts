const AVATAR_SIZE = 256;

// Funkcja przycinająca i zmniejszająca zdjęcie do awatara 256×256.
export const resizeToAvatar = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = AVATAR_SIZE;
      const [x, y] = [(img.width - side) / 2, (img.height - side) / 2];
      canvas.getContext("2d")!.drawImage(img, x, y, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      URL.revokeObjectURL(url);
      const webp = canvas.toDataURL("image/webp", 0.85);
      resolve(webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nie udało się wczytać obrazka."));
    };
    img.src = url;
  });
