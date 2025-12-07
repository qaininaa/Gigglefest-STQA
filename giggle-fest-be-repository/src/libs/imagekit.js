import ImageKit from "imagekit";

// Initialize ImageKit only if credentials are available (skip in test environment)
let imagekit = null;

if (
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

export const uploadImage = async (file) => {
  try {
    // If ImageKit is not initialized (test environment), return mock URL
    if (!imagekit) {
      console.warn("ImageKit not initialized, using mock upload");
      return `https://mock-imagekit.io/${file.originalname}`;
    }

    const response = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
    });
    return response.url;
  } catch (error) {
    throw new Error("Image upload failed");
  }
};
