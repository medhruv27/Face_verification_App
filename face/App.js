import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import axios from 'axios';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCaptureAllowed, setIsCaptureAllowed] = useState(true);
  const [isFaceInOval, setIsFaceInOval] = useState(false);
  const [isFaceInId, setIsFaceInId] = useState(false);
  const [isBrightEnough, setIsBrightEnough] = useState(false);
  const cameraRef = useRef(null);

  const BRIGHTNESS_THRESHOLD = 110;
  const MOI = 0.25;

  useEffect(() => {
    Camera.requestCameraPermission().then((p) => setHasPermission(p === 'granted'));
  }, []);

  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'front');

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none',
    autoScale: false,
  });

  const captureFrame = async () => {
    if (isCaptureAllowed && cameraRef.current) {
      setIsCaptureAllowed(false);
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });
      setCapturedImage(`file://${photo.path}`);
      setIsCameraActive(false);
      await uploadImageToServer(`file://${photo.path}`);
    }
  };

  const uploadImageToServer = async (imagePath) => {
    try {
      setIsVerifying(true);
      const formData = new FormData();
      formData.append('frame', {
        uri: imagePath,
        type: 'image/jpeg',
        name: 'frame.jpg',
      });

      const response = await axios.post('http://192.168.0.82:5000/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsVerifying(false);

      if (response.data && response.data.output) {
        Alert.alert('Face Verification', response.data.output, [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', 'Unknown error occurred', [{ text: 'OK' }]);
      }
    } catch (error) {
      setIsVerifying(false);
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image', [{ text: 'OK' }]);
    }
  };

  const triggerCapture = Worklets.createRunOnJS(() => {
    setTimeout(captureFrame, 1500); // 1.5 second delay
  });

  const updateFaceInOval = Worklets.createRunOnJS((value) => {
    setIsFaceInOval(value);
  });

  const updateFaceInId = Worklets.createRunOnJS((value) => {
    setIsFaceInId(value);
  });

  const updateBrightness = Worklets.createRunOnJS((value) => {
    setIsBrightEnough(value);
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    
    const imageWidth = frame.width;
    const imageHeight = frame.height;

    // Oval bounds for face guideline
    const ovalBounds = { 
      x: imageWidth * 0.1,
      y: imageHeight * 0.1,
      width: imageWidth * 0.8,
      height: imageHeight * 0.4,
    };

    const ovalCenterX = ovalBounds.x + ovalBounds.width / 2;
    const ovalCenterY = ovalBounds.y + ovalBounds.height / 2;

    const idBounds = {
      x: imageHeight * 0.5,
      y: imageWidth * 0.65,
      width: imageWidth * 0.45,
      height: imageHeight * 0.25,
    };

    const marginOfError = Math.min(ovalBounds.width, ovalBounds.height) * 0.2;
    let faceInOval = false;
    let faceInId = false;

    if (faces.length > 0) {
      faces.forEach((face) => {
        const faceBounds = face.bounds;

        // Apply manual scaling and flipping for front camera
        const faceCenterX = faceBounds.x + faceBounds.width / 2;
        const faceCenterY = faceBounds.y + faceBounds.height / 2;

        // Check if face center is within the oval
        const dxOval = (faceCenterX - ovalCenterX) / (ovalBounds.width / 2);
        const dyOval = (faceCenterY - ovalCenterY) / (ovalBounds.height / 2);

        if (dxOval * dxOval + dyOval * dyOval <= 1) {
          faceInOval = true;
        }
        if (
          faceCenterX >= idBounds.x &&
          faceCenterX <= idBounds.x + idBounds.width &&
          faceCenterY >= idBounds.y &&
          faceCenterY <= idBounds.y + idBounds.height
        ) {
          faceInId = true;
        }
      });
    }

    // Check brightness
    const buffer = frame.toArrayBuffer();
    const data = new Uint8Array(buffer);
    let luminanceSum = 0;
    const sampleSize = data.length;
    for (let i = 0; i < sampleSize; i++) {
      luminanceSum += data[i];
    }
    const averageBrightness = luminanceSum / sampleSize;
    const isBright = averageBrightness > BRIGHTNESS_THRESHOLD;

    updateFaceInOval(faceInOval);
    updateFaceInId(faceInId);
    updateBrightness(isBright);


    // Trigger photo capture when 2 faces are detected, oval is green, and it's bright enough
    if (faces.length == 2 && faceInOval && faceInId && isBright) {
      triggerCapture();
    }
  }, []);

  const closeImagePreview = () => {
    setCapturedImage(null);
    setIsCameraActive(true);
    setIsCaptureAllowed(true);
  };

  if (!hasPermission) {
    return <Text style={styles.noPermissionText}>Camera permission not granted</Text>;
  }

  if (!device) {
    return <Text style={styles.noPermissionText}>No camera device found</Text>;
  }

  return (
    <View style={styles.container}>
      {!capturedImage && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isCameraActive}
          frameProcessor={frameProcessor}
          photo={true} 
          isMirrored = {true}
        />
      )}
      
      {isCameraActive && (
        <>
          <View style={[styles.oval, { borderColor: isFaceInOval ? 'green' : 'red' }]} />
          <View style={[styles.rectangle, { borderColor: isFaceInId ? 'green' : 'white' }]} />
          <View style={[styles.idOval, { borderColor: isFaceInId ? 'green' : 'white' }]} />
          {!isBrightEnough && (
            <View style={styles.brightnessFeedbackContainer}>
              <Text style={styles.warningText}>
                Please adjust your lighting for better image capture.
              </Text>
            </View>
          )}
        </>
      )}

      {capturedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
          {isVerifying ? (
            <View style={styles.loadingOverlay}>
              <Text style={styles.verifyingText}>Verifying...</Text>
              <ActivityIndicator size="large" color="#007aff" />
            </View>
          ) : (
            <TouchableOpacity style={styles.closeButton} onPress={closeImagePreview}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  noPermissionText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  oval: {
    position: 'absolute',
    left: '15%',
    top: '10%',
    width: '70%',
    height: '40%',
    borderWidth: 5,
    borderRadius: 150,
  },
  rectangle: {
    position: 'absolute',
    left: '5%',
    top: '65%',
    width: '90%',
    height: '25%',
    borderWidth: 5,
    borderColor: 'white',
    borderRadius: 20,
  },
  idOval : {
    position: 'absolute',
    bottom: '12%',
    left: '60%',
    width: '30%',
    height: '21%',
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 100,
  },
  brightnessFeedbackContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
  },
  warningText: {
    color: 'red',
    fontSize: 16,
  },
  imagePreviewContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'black',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 20,
  },
});










