import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

//save paths 
const selfieImagePath = FileSystem.cacheDirectory + 'selfie.jpg';
const idImagePath = FileSystem.cacheDirectory + 'id.jpg';

//upload 
const uploadImages = async () => {
    try {
      const uploadUrl = 'http://192.168.0.127:8888/upload.php'; // Use your local machine's IP address
  
      // Prepare selfie image for upload
      const selfie = await FileSystem.getInfoAsync(selfieImagePath);
      const idPhoto = await FileSystem.getInfoAsync(idImagePath);
  
      if (!selfie.exists || !idPhoto.exists) {
        throw new Error('Images not found in cache');
      }
  
      // Upload both images using a fetch request
      const formData = new FormData();
      formData.append('selfie', {
        uri: selfie.uri,
        name: 'selfie.jpg',
        type: 'image/jpeg',
      });
      formData.append('idPhoto', {
        uri: idPhoto.uri,
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
  
      const result = await response.json();
      console.log(result.message);
  
      if (response.ok) {
        // Remove files from cache after successful upload
        await FileSystem.deleteAsync(selfieImagePath, { idempotent: true });
        await FileSystem.deleteAsync(idImagePath, { idempotent: true });
  
        Alert.alert('Success', 'Images uploaded and cache cleared');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Upload failed:', error.message);
      Alert.alert('Upload Error', error.message);
    }
  };
  
  export default { uploadImages };