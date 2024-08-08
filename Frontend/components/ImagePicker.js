import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const selfieImagePath = FileSystem.cacheDirectory + 'selfie.jpg';
const idImagePath = FileSystem.cacheDirectory + 'id.jpg';

const pickImage = async (isSelfie) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permissions not granted');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
    cameraType: isSelfie ? 'front' : 'back',
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    const tempDirectory = isSelfie ? selfieImagePath : idImagePath;

    await FileSystem.copyAsync({
      from: imageUri,
      to: tempDirectory,
    });

    console.log(`Image saved to: ${tempDirectory}`);
    return tempDirectory;
  } else {
    console.log('Process cancelled');
    return null;
  }
};

export default { pickImage };
