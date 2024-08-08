import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';



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
    return result.assets[0].uri;
  } else {
    return null;
  }
};



export default { pickImage };