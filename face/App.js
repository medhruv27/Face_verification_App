import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { Skia, PaintStyle } from '@shopify/react-native-skia';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import axios from 'axios';
import { runAtTargetFps } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated'; 

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isFrameProcessorActive, setIsFrameProcessorActive] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCaptureAllowed, setIsCaptureAllowed] = useState(true);
  const cameraRef = useRef(null);
  // 
  const [brightness, setBrightness] = useState(0); 
  const [isBrightnessFeedbackVisible, setIsBrightnessFeedbackVisible] = useState(true); 
  const BRIGHTNESS_THRESHOLD = 110;
  // 
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
    if (isCaptureAllowed) {
      //try {
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
      // } catch (error) {
      //   console.error('Error taking photo:', error);
      // }
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

      const response = await axios.post('http://192.168.0.12:5000/media/upload', formData, {
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

  const onLightDetected = Worklets.createRunOnJS((luminanceState) => {
        setIsBrightnessFeedbackVisible(!luminanceState);
      });
  const frameProcessor = useSkiaFrameProcessor(frame => {
  // const frameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    // 
    const buffer = frame.toArrayBuffer();
    const data = new Uint8Array(buffer);
    console.log('pixelcount', data.length);
    let luminanceSum = 0;
    const sampleSize = data.length;
    for (let i = 0; i < sampleSize; i++) {
      luminanceSum += data[i];
    }
    const averageBrightness = luminanceSum / sampleSize;
    console.log('luminance', averageBrightness);
    const luminanceState = averageBrightness > BRIGHTNESS_THRESHOLD;
    console.log('luminancestate', luminanceState);
    try {
      void onLightDetected(luminanceState);
    } catch (lightDetectedError) {
      console.error('Error in onLightDetected:', lightDetectedError);
    }
    // 
    const faces = detectFaces(frame);
    frame.render();
  
    const canvasWidth = frame.width;
    const canvasHeight = frame.height;
  
    // Oval bounds for face guideline
    const ovalBounds = { 
      x: canvasWidth / 2.5,
      y: canvasHeight / 4,
      width: canvasWidth / 2,
      height: canvasHeight / 2,
    };
  
    // Rectangle bounds for ID card
    const rectBounds = {
      x: canvasWidth / 10,
      y: canvasHeight / 4.8,
      width: canvasWidth / 4,
      height: canvasHeight / 1.7,
    };
  
    const ovalCenterX = ovalBounds.x + ovalBounds.width / 2;
    const ovalCenterY = ovalBounds.y + ovalBounds.height / 2;
  
    const marginOfError = 65;
    let faceInOval = false;
  
    // Create paint objects
    const paint = Skia.Paint();
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(5);
  
    const facePaint = Skia.Paint();
    facePaint.setStyle(PaintStyle.Stroke);
    facePaint.setStrokeWidth(2);
    facePaint.setColor(Skia.Color('yellow'));
  
    if (faces.length > 0) {
      faces.forEach((face) => {
        const faceBounds = face.bounds;
  
        // Apply manual scaling and flipping for front camera
        const transformedBounds = {
          x: canvasWidth - (faceBounds.x + faceBounds.width), // Flip on x-axis for mirroring
          y: faceBounds.y,
          width: faceBounds.width,
          height: faceBounds.height,
        };
  
        const faceCenterX = transformedBounds.x + transformedBounds.width / 2;
        const faceCenterY = transformedBounds.y + transformedBounds.height / 2;
  
        // Check if the face is within the oval with margin of error
        if (
          Math.abs(faceCenterX - ovalCenterX) <= marginOfError &&
          Math.abs(faceCenterY - ovalCenterY) <= marginOfError
        ) {
          faceInOval = true;
        }
      });
    }
  
    // Draw the oval
    paint.setColor(Skia.Color(faceInOval ? 'green' : 'red'));
    frame.drawOval(ovalBounds, paint);
  
    // Draw the rectangle (static white)
    paint.setColor(Skia.Color('white'));
    frame.drawRRect({
      rect: rectBounds,
      rx: 20,
      ry: 20,
    }, paint);
  
    // Trigger photo capture when 2 faces are detected and oval is green
    if (faces.length >= 2 && faceInOval && luminanceState) {
      triggerCapture();
    }
  // }, []);
});


  const closeImagePreview = () => {
    setCapturedImage(null);
    setIsCameraActive(true);
    setIsFrameProcessorActive(true);
    setIsCaptureAllowed(true);
  };

  return (
    <View style={styles.container}>
      {!hasPermission && <Text style={styles.noPermissionText}>Camera permission not granted</Text>}
      {hasPermission && device != null && !capturedImage && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isCameraActive}
          frameProcessor={isFrameProcessorActive ? frameProcessor : undefined}
          photo={true}
          mirror={true}
        />
      )}
      
      {isCameraActive && isBrightnessFeedbackVisible && (
        <View style={styles.brightnessFeedbackContainer}>
          {brightness < BRIGHTNESS_THRESHOLD && (
            <Text style={styles.warningText}>
              Please adjust your lighting for better image capture.
            </Text>
          )}
        </View>
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
  camera: {
    flex: 1,
    width: '100%',
  },
  //
  brightnessFeedbackContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brightnessText: {
    color: 'white',
    fontSize: 18,
  },
  warningText: {
    color: 'red',
    fontSize: 16,
  },
  //
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










