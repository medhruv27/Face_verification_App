import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevices, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import uploadHandler from './uploadHandler'; // Import your upload handler

function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isFrameProcessorActive, setIsFrameProcessorActive] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
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

  const captureFrame = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        photo: true,
      });
      setCapturedImage(`file://${photo.path}`);
      setIsCameraActive(false);
      setIsFrameProcessorActive(false);

      // Upload the captured image
      await uploadHandler.uploadCapturedImage(`file://${photo.path}`);
    }
  };

  const frameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    frame.render();

    if (faces.length >= 2) {
      Worklets.runOnJS(captureFrame)();
    }

    for (const face of faces) {
      if (face?.bounds) {
        const { x, y, width, height } = face.bounds;
        const adjustedX = x + 150;
        const adjustedY = y - 5;
        const paint = Skia.Paint();
        paint.setColor(Skia.Color('red'));
        paint.setStyle(PaintStyle.Stroke);
        frame.drawRect({ x: adjustedX, y: adjustedY, width: width, height: height }, paint);
      }
    }
  }, []);

  const closeImagePreview = () => {
    setCapturedImage(null);
    setIsCameraActive(true);
    setIsFrameProcessorActive(true);
  };

  return (
    <View style={styles.container}>
      {!hasPermission && <Text style={styles.text}>No Camera Permission</Text>}
      {hasPermission && device != null && !capturedImage && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isCameraActive}
          frameProcessor={isFrameProcessorActive ? frameProcessor : undefined}
        />
      )}
      {capturedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
          <TouchableOpacity style={styles.closeButton} onPress={closeImagePreview}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    color: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
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
});

export default App;













  

















 
















