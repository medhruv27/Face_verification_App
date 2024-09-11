import { Skia, PaintStyle } from '@shopify/react-native-skia';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import axios from 'axios';

function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFrameProcessorActive, setIsFrameProcessorActive] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCaptureAllowed, setIsCaptureAllowed] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const cameraRef = useRef(null);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none',
    autoScale: false,
  });

  useEffect(() => {
    Camera.requestCameraPermission().then((p) => setHasPermission(p === 'granted'));
  }, []);

  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'front');

  const uploadImageToServer = async (imagePath) => {
    try {
      setIsVerifying(true);
      const formData = new FormData();
      formData.append('frame', {
        uri: imagePath,
        type: 'image/jpeg',
        name: 'frame.jpg',
      });

      const response = await axios.post('http://192.168.0.104:5000/media/upload', formData, {
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

  const captureFrame = async () => {
    if (isCaptureAllowed) {
      try {
        if (cameraRef.current) {
          setIsCaptureAllowed(false);
          
          const photo = await cameraRef.current.takePhoto({
            qualityPrioritization: 'quality',
            flash: 'off',
          });
          setCapturedImage(`file://${photo.path}`);
          setIsFrameProcessorActive(false);
          setIsCameraActive(false);
          await uploadImageToServer(`file://${photo.path}`);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };

  const myFunctionJS = Worklets.createRunOnJS(() => {
    if (!isProcessing && isCaptureAllowed) {
      setFaceDetected(true);
    }
  });

  const frameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    frame.render();

    if (faces.length >= 2 && !faceDetected) {
      const isLargeEnough = faces.every((face) => {
        const { width, height } = face.bounds;
        return width > 20 && height > 20;
      });
  
      if (isLargeEnough) {
        myFunctionJS();
      }
    }

    for (const face of faces) {
      if (face?.bounds) {
        const { x, y, width, height } = face.bounds;
        const adjustedX = x + 150;
        const adjustedY = y - 5;
        const paint = Skia.Paint();
        paint.setColor(Skia.Color('red'));
        paint.setStyle(PaintStyle.Stroke);
        frame.drawRect({ x: adjustedX, y: adjustedY, width, height }, paint);
      }
    }
  }, []);

  useEffect(() => {
    if (faceDetected) {
      captureFrame();
    }
  }, [faceDetected]);

  const openCamera = () => {
    setIsCameraActive(true);
  };

  const closeImagePreview = () => {
    setCapturedImage(null);
    setIsCameraActive(false);
    setIsFrameProcessorActive(true);
    setFaceDetected(false);
    setIsCaptureAllowed(true);
  };

  return (
    <View style={styles.container}>
      {!hasPermission && <Text style={styles.noPermissionText}>Camera permission not granted</Text>}
      {hasPermission && !isCameraActive && !capturedImage && (
        <TouchableOpacity style={styles.openCameraButton} onPress={openCamera}>
          <Text style={styles.openCameraButtonText}>Open Camera</Text>
        </TouchableOpacity>
      )}
      {hasPermission && isCameraActive && device != null && !capturedImage && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isCameraActive}
          frameProcessor={isFrameProcessorActive ? frameProcessor : undefined}
          photo={true}
          mirror={false}
        />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPermissionText: {
    fontSize: 18,
    color: 'white',
  },
  openCameraButton: {
    backgroundColor: '#007aff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  openCameraButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
    width: '100%',
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

export default App;






















 
















