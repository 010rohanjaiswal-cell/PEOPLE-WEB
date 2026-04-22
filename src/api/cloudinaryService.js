// Cloudinary service for image uploads
import axios from 'axios';

const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL || 'https://api.cloudinary.com/v1_1/dzpqrejsi';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dzpqrejsi';

export const cloudinaryService = {
  // Upload image to Cloudinary
  uploadImage: async (file, folder = 'freelancing-platform') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'unsigned'); // Using unsigned upload preset
      formData.append('folder', folder);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      const response = await axios.post(`${CLOUDINARY_UPLOAD_URL}/image/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        url: response.data.secure_url,
        publicId: response.data.public_id,
        data: response.data
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Upload preset used:', 'unsigned');
      console.error('Cloud name:', CLOUDINARY_CLOUD_NAME);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  },

  // Delete image from Cloudinary
  deleteImage: async (publicId) => {
    try {
      const response = await axios.delete(`${CLOUDINARY_UPLOAD_URL}/image/destroy`, {
        data: {
          public_id: publicId,
          cloud_name: CLOUDINARY_CLOUD_NAME
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image'
      };
    }
  },

  // Get image URL with transformations
  getImageUrl: (publicId, transformations = {}) => {
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const transformString = Object.entries(transformations)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    return transformString 
      ? `${baseUrl}/${transformString}/${publicId}`
      : `${baseUrl}/${publicId}`;
  }
};

export default cloudinaryService;
