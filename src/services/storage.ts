import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, isConfigValid } from "../firebase/config";

/**
 * Compresses an image in the browser and returns it as a Base64 JPEG string.
 * Keeps document size small (approx 30KB - 50KB) to comfortably fit Firestore's 1MB limit.
 */
const compressImageToBase64 = (file: File, maxWidth = 500, maxHeight = 500, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to high-performance web compressed JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = () => {
      resolve("");
    };
  });
};

/**
 * Set to true to use Firebase Storage. If false, images are compressed and stored inline in Firestore.
 * Since Firebase Storage can require billing upgrades (Blaze Plan) or complex GCS CORS configs,
 * setting this to false allows the application to remain 100% free with zero-configuration.
 */
const USE_FIREBASE_STORAGE = false;

/**
 * Uploads a file to Firebase Storage. If Storage is disabled, restricted, 
 * or unconfigured, it automatically fallbacks to client-side compressed base64 strings.
 */
export const uploadImage = async (path: string, file: File): Promise<string> => {
  const compressedBase64 = await compressImageToBase64(file);

  if (!isConfigValid || !USE_FIREBASE_STORAGE) {
    return compressedBase64;
  }

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn(
      "Firebase Storage is disabled or demands pricing upgrades. Falling back to compressed base64 inline Firestore storage.",
      error
    );
    return compressedBase64;
  }
};

/**
 * Deletes an image from Firebase Storage (noop if it is a base64 string or mock path)
 */
export const deleteImage = async (path: string): Promise<void> => {
  if (!isConfigValid || path.startsWith("data:")) {
    return; // Noop in mock mode or for base64 inline assets
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Could not delete image:", error);
  }
};
