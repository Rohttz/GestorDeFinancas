import React from 'react';
import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { useTheme } from '@/src/contexts/ThemeContext';

interface InputMaskProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (text: string, rawValue: string) => void;
  mask?: string;
  error?: string;
}

export const InputMask: React.FC<InputMaskProps> = ({
  label,
  value,
  onChangeText,
  mask,
  error,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const handleChangeText = (text: string, rawValue: string) => {
    onChangeText(text, rawValue);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      {mask ? (
        <MaskedTextInput
          mask={mask}
          value={value}
          onChangeText={handleChangeText}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error ? colors.danger : colors.border,
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
      ) : (
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text, text)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error ? colors.danger : colors.border,
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
      )}
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
