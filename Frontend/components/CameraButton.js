
import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import ImagePicker from "./ImagePicker";
import theme from '../theme';

const CameraButton = ({ label, isSelfie, onCapture }) => {
    const handlePress = async () => {
        try {
            const imageUri = await ImagePicker.pickImage(isSelfie);
            if (imageUri) {
                onCapture(imageUri, isSelfie);
            }
        } catch (error) {
            console.error('Error taking photo:', error.message);
        }
    };

    return (
        <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.secondary,
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: theme.buttonText,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CameraButton;