import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export type Palette = {
  dark: boolean;
  bg: string;
  card: string;
  card2: string;
  text: string;
  sub: string;
  muted: string;
  border: string;
  primary: string;
  success: string;
  danger: string;
  warning: string;
};

export const makePalette = (dark: boolean): Palette => ({
  dark,
  bg: dark ? '#0b0f19' : '#f1f5f9',
  card: dark ? '#151c2c' : '#ffffff',
  card2: dark ? '#1e293b' : '#f8fafc',
  text: dark ? '#f8fafc' : '#0f172a',
  sub: dark ? '#cbd5e1' : '#475569',
  muted: dark ? '#64748b' : '#94a3b8',
  border: dark ? '#243049' : '#e2e8f0',
  primary: dark ? '#818cf8' : '#4f46e5',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
});

export function Card({ children, palette, style }: { children: ReactNode; palette: Palette; style?: object }) {
  return <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  palette,
  variant = 'primary',
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  palette: Palette;
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
}) {
  const bg = variant === 'ghost' ? 'transparent' : variant === 'danger' ? palette.danger : variant === 'success' ? palette.success : palette.primary;
  const border = variant === 'ghost' ? palette.border : bg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: variant === 'ghost' ? palette.text : '#ffffff' }]}>{title}</Text>
    </Pressable>
  );
}

export function SectionTitle({ title, subtitle, palette }: { title: string; subtitle?: string; palette: Palette }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: palette.sub }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function EmptyState({ text, palette }: { text: string; palette: Palette }) {
  return (
    <Card palette={palette} style={{ alignItems: 'center', paddingVertical: 28 }}>
      <Text style={{ color: palette.sub, textAlign: 'center', fontWeight: '700' }}>{text}</Text>
    </Card>
  );
}

export function Loading({ palette, text = 'Đang tải...' }: { palette: Palette; text?: string }) {
  return (
    <View style={{ padding: 24, alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={palette.primary} />
      <Text style={{ color: palette.sub }}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
});
