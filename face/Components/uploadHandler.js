import RNFS from 'react-native-fs';

const uploadCapturedImage = async (imageUri) => {
  try {
    const uploadUrl = 'http://192.168.0.87:5000/media/upload'; // Adjust this to your backend URL

    // Create a FormData instance
    const formData = new FormData();
    formData.append('captured_image', {
      uri: imageUri,
      name: 'captured_image.jpg',
      type: 'image/jpeg',
    });

    // Perform the fetch request
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result.output);

    return { message: result.output };
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
};

export default { uploadCapturedImage };
