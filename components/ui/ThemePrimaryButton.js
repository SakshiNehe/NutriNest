import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const ThemePrimaryButton = ({ 
  mode = 'contained', 
  onPress, 
  loading = false, 
  disabled = false, 
  labelStyle = {}, 
  style = {}, 
  icon,
  children 
}) => {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      labelStyle={[styles.label, labelStyle]}
      style={[styles.button, style]}
      icon={icon}
    >
      {children}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    paddingVertical: 2,
  },
});

export default ThemePrimaryButton; 