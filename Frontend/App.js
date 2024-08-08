import React, { useState } from "react";
import { Button, StyleSheet, View, Image, Text, ScrollView } from "react-native";
import CameraButton from "./components/CameraButton";
import UploadHandler from "./components/UploadHandler";
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [selfieUri, setSelfieUri] = useState(null);
  const [idUri, setIdUri] = useState(null);
  const [selfieKey, setSelfieKey] = useState(Date.now()); // Unique key for selfie
  const [idKey, setIdKey] = useState(Date.now()); // Unique key for ID photo

  const handleUpload = async () => {
    try {
      await UploadHandler.uploadImages();
      setSelfieUri(null);
      setIdUri(null);
      setSelfieKey(Date.now()); // Reset key for selfie
      setIdKey(Date.now()); // Reset key for ID photo
    } catch (error) {
      console.error('Error uploading images', error.message);
    }
  };

  const handleSelfie = (uri) => {
    console.log('Selfie URI:', uri); // Debugging
    setSelfieUri(uri);
    setSelfieKey(Date.now()); // Update key for selfie
  };

  const handleID = (uri) => {
    console.log('ID URI:', uri); // Debugging
    setIdUri(uri);
    setIdKey(Date.now()); // Update key for ID photo
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.buttonContainer}>
        <CameraButton label="Take Selfie" isSelfie={true} onImageTaken={handleSelfie} />
        <CameraButton label="Take photo of ID" isSelfie={false} onImageTaken={handleID} />
      </View>
      {selfieUri && (
        <View style={styles.previewContainer}>
          <Text>Selfie Preview:</Text>
          <Image key={selfieKey} source={{ uri: selfieUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <Button title="Proceed" onPress={() => setSelfieUri(null)} />
            <Button title="Take another photo" onPress={() => setSelfieUri(null)} />
          </View>
        </View>
      )}
      {idUri && (
        <View style={styles.previewContainer}>
          <Text>ID Photo Preview:</Text>
          <Image key={idKey} source={{ uri: idUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <Button title="Proceed" onPress={() => setIdUri(null)} />
            <Button title="Take another photo" onPress={() => setIdUri(null)} />
          </View>
        </View>
      )}
      <View style={styles.uploadButton}>
        <Button title="UPLOAD" onPress={handleUpload} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  uploadButton: {
    marginTop: 20,
    width: '80%',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});
