import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text, Alert} from "react-native";
import CameraButton from "./components/CameraButton";
import UploadHandler from "./components/UploadHandler";
import ImageReviewModal from "./components/ImageReviewModal";
import theme from './theme';

export default function App() {
  const [selfieImage, setSelfieImage] = useState(null);
  const [idImage, setIdImage] = useState(null);
  const [reviewImage, setReviewImage] = useState(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(null);
  
  const handleImageCapture = (imageUri, isSelfie) => {
    setReviewImage(imageUri);
    setCurrentImageType(isSelfie ? 'selfie' : 'id');
    setIsReviewModalVisible(true);
  };
  
  const handleProceed = () => {
    if (currentImageType === 'selfie') {
      setSelfieImage(reviewImage);
    }else {
      setIdImage(reviewImage);
    }
    setIsReviewModalVisible(false);
  };

  const handleTryAgain = () => {
    setIsReviewModalVisible(false);
  };
  
  const handleUpload = async () => {
    if (!selfieImage || !idImage) {
      Alert.alert('Error', 'Please capture both selfie and ID images before uploading.');
      return;
    }

    try {
      const result = await UploadHandler.uploadImages(selfieImage, idImage);
      Alert.alert('Success', result.message);
      setSelfieImage(null);
      setIdImage(null);
    } catch (error) {
      console.error('Error uploading images', error.message);
      Alert.alert('Error', 'Failed to upload images. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraButton label="Take Selfie" isSelfie={true} onCapture={handleImageCapture} />
      <CameraButton label="Take photo of ID" isSelfie={false} onCapture={handleImageCapture} />
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.uploadButtonText}>UPLOAD</Text>
      </TouchableOpacity>
      <ImageReviewModal
        visible={isReviewModalVisible}
        imageUri={reviewImage}
        onProceed={handleProceed}
        onTryAgain={handleTryAgain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});