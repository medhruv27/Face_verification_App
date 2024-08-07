import React from "react";
import { StyleSheet, View, Button, Alert } from "react-native";
import ImagePicker from "./ImagePicker";

const CameraButton = ({ label, isSelfie, onImageTaken }) => {
  const handlePress = async () => {
    try {
      const imageUri = await ImagePicker.pickImage(isSelfie);
      console.log('Image taken:', imageUri); // Debugging
      if (imageUri) {
        onImageTaken(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.buttonContainer}>
      <Button title={label} onPress={handlePress} />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginVertical: 10,
    width: '40%',
  },
});

export default CameraButton;
