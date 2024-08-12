import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import theme from '../theme';

const ImageReviewModal = ({ visible, imageUri, onProceed, onTryAgain}) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={onProceed}>
                        <Text style={styles.buttonText}>Proceed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.tryAgainButton]} onPress={onTryAgain}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9',
    },
    image: {
        width: '90%',
        height: '70%',
        resizeMode: 'contain',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        padding: 20,
    },
    button: {
        backgroundColor: theme.primary,
        padding: 15,
        borderRadius: 10,
        width: '40%',
        alignItems: 'center',
    },
    tryAgainButton: {
        backgroundColor: theme.secondary,
    },
    buttonText: {
        color: theme.buttonText,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ImageReviewModal;
