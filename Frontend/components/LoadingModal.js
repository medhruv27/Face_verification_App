import React from "react";
import { View, Text, Modal, StyleSheet, ActivityIndicator } from "react-native";
import theme from "../theme";

const LoadingModal = ({ visible }) => {
    return(
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Verifying...</Text>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: theme.buttonText,
        fontWeight: 'bold',
    },
});

export default LoadingModal;