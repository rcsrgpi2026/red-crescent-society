import cloudinaryPkg, { type UploadApiResponse } from "cloudinary";
const cloudinary = cloudinaryPkg.v2;

export function isCloudinaryConfigured(): boolean {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinaryClient() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

interface CloudinaryUploadOptions {
  folder: string;
  publicId?: string;
  overwrite?: boolean;
  isPdf?: boolean;
}

/**
 * Uploads an image or PDF buffer directly to Cloudinary and returns its secure delivery URL.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: CloudinaryUploadOptions
): Promise<string> {
  const client = getCloudinaryClient();
  const sanitizedFolder = `red-crescent/${options.folder.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const resourceType = options.isPdf ? "auto" : "image";

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: sanitizedFolder,
        public_id: options.publicId,
        overwrite: options.overwrite ?? false,
        invalidate: true,
        resource_type: resourceType,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error || new Error("Failed to upload file to Cloudinary"));
        }

        let secureUrl = result.secure_url;

        // For images only: Inject f_auto,q_auto into the Cloudinary delivery URL
        if (
          !options.isPdf &&
          secureUrl.includes("/image/upload/") &&
          !secureUrl.includes("/f_auto,q_auto/")
        ) {
          secureUrl = secureUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
        }

        resolve(secureUrl);
      }
    );

    uploadStream.end(buffer);
  });
}
