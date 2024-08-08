import * as FileSystem from 'expo-file-system';

const uploadImages = async (selfieUri, idUri) => {
  try {
    const uploadUrl = 'http://192.168.0.193:5000/media/upload';

    const formData = new FormData();
    formData.append('person', {
      uri: selfieUri,
      name: 'person',
      type: 'image/jpeg',
    });
    formData.append('id_card', {
      uri: idUri,
      name: 'id_card',
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
    console.log(result.output);

    return { message: 'Images uploaded successfully' };
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
};

export default { uploadImages };