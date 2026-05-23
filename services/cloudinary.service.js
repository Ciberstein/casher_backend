const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder path
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<string>} Secure URL of the uploaded file
 */
const upload = async (buffer, folder, mimetype) => {
  const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';
  const b64 = Buffer.from(buffer).toString('base64');
  const dataUri = `data:${mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: resourceType });
  return result.secure_url;
};

// Extracts public_id from a Cloudinary secure URL
// e.g. https://res.cloudinary.com/cloud/image/upload/v123/avatars/file.jpg → avatars/file
const extractPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return match ? match[1] : null;
};

const destroy = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { upload, destroy };
