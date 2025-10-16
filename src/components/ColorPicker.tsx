import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  error?: string;
  allowCustom?: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6',
  '#60A5FA',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#14B8A6',
  '#0EA5E9',
  '#1F2937',
  '#4B5563',
];

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  colors = DEFAULT_COLORS,
  error,
  allowCustom = true,
}) => {
  const { colors: themeColors } = useTheme();
  const [customColor, setCustomColor] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [isTypingCustom, setIsTypingCustom] = useState(false);

  const palette = useMemo(() => colors.map((color) => color.toLowerCase()), [colors]);

  useEffect(() => {
    if (isTypingCustom) return;

    if (!value) {
      setCustomColor('');
      setCustomError(null);
      return;
    }

    const lowerValue = value.toLowerCase();
    if (!palette.includes(lowerValue)) {
      const normalized = value.startsWith('#') ? value : `#${value}`;
      setCustomColor(normalized);
      setCustomError(HEX_REGEX.test(normalized) ? null : 'Cor inválida. Use o formato #RRGGBB.');
    } else {
      setCustomColor('');
      setCustomError(null);
    }
  }, [isTypingCustom, palette, value]);

  const handleSelectColor = (color: string) => {
    setIsTypingCustom(false);
    setCustomColor('');
    setCustomError(null);
    onChange(color.toUpperCase());
  };

  const handleCustomChange = (text: string) => {
    const normalized = text.startsWith('#') ? text : `#${text}`;
    setCustomColor(normalized);
    setIsTypingCustom(true);

    if (normalized.trim().length === 0) {
      setCustomError(null);
      setIsTypingCustom(false);
      return;
    }

    if (HEX_REGEX.test(normalized)) {
      setCustomError(null);
      onChange(normalized.toUpperCase());
      setIsTypingCustom(false);
    } else {
      setCustomError('Informe um código hexadecimal válido, por exemplo #3B82F6.');
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
      <View style={[styles.swatchWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchList}>
          {colors.map((color) => {
            const selected = value?.toLowerCase() === color.toLowerCase();
            return (
              <TouchableOpacity
                key={color}
                style={styles.swatchButton}
                onPress={() => handleSelectColor(color)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: color,
                      borderColor: selected ? themeColors.primary : themeColors.border,
                      borderWidth: selected ? 3 : 1,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.selectedPreview}>
          <View style={[styles.previewCircle, { backgroundColor: value || themeColors.primary }]} />
          <Text style={[styles.previewLabel, { color: themeColors.textSecondary }]}>{value?.toUpperCase() || '—'}</Text>
        </View>
      </View>
      {allowCustom && (
        <View style={styles.customInputContainer}>
          <Text style={[styles.customLabel, { color: themeColors.textSecondary }]}>Ou digite uma cor personalizada</Text>
          <TextInput
            style={[styles.customInput, { borderColor: customError ? themeColors.danger : themeColors.border, color: themeColors.text }]}
            placeholder="#000000"
            placeholderTextColor={themeColors.textSecondary}
            value={customColor}
            onChangeText={handleCustomChange}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {customError && <Text style={[styles.error, { color: themeColors.danger }]}>{customError}</Text>}
        </View>
      )}
      {error && <Text style={[styles.error, { color: themeColors.danger }]}>{error}</Text>}
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
    marginBottom: 8,
  },
  swatchWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  swatchList: {
    flexDirection: 'row',
    gap: 12,
  },
  swatchButton: {
    padding: 2,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  selectedPreview: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInputContainer: {
    marginTop: 12,
  },
  customLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  customInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  previewCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
