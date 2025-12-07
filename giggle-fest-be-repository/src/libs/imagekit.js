import ImageKit from "imagekit";

// Lazy initialization - hanya inisialisasi saat pertama kali digunakan
let imagekit = null;

const getImageKit = () => {
  if (
    !imagekit &&
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  ) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
};

export const uploadImage = async (file) => {
  try {
    const kit = getImageKit();

    // Jika ImageKit tidak tersedia (test environment), return mock URL
    if (!kit) {
      console.warn("ImageKit not configured, using mock upload for testing");
      return `https://mock.imagekit.io/${Date.now()}-${file.originalname}`;
    }

    const response = await kit.upload({
      file: file.buffer,
      fileName: file.originalname,
    });
    return response.url;
  } catch (error) {
    throw new Error("Image upload failed");
  }
};
