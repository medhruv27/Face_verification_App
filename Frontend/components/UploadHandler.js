import * as FileSystem from 'expo-file-system';

const uploadImages = async (selfieUri, idUri) => {
  try {
    const uploadUrl = 'http://192.168.0.193:8888/upload.php';

    const formData = new FormData();
    formData.append('selfie', {
      uri: selfieUri,
      name: 'selfie.jpg',
      type: 'image/jpeg',
    });
    formData.append('idPhoto', {
      uri: idUri,
      name: 'id.jpg',
      type: 'image/jpeg',
    });

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
    console.log(result.message);

    return { message: 'Images uploaded successfully' };
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
};

export default { uploadImages };