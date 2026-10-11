import { StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 28 },
  inset: { marginHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  section: { marginHorizontal: 20, marginTop: 8, marginBottom: 12, color: Colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  text: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500', lineHeight: 23 },
  secondary: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  action: { color: Colors.accent, fontSize: 14, fontWeight: '600', paddingVertical: 12 },
  error: { color: Colors.danger, fontSize: 13, fontWeight: '600', marginTop: 10 },
  input: { backgroundColor: Colors.inputBackground, borderColor: Colors.inputBorder, borderWidth: 1, borderRadius: 12, color: Colors.textPrimary, padding: 12, fontSize: 15, minHeight: 90, textAlignVertical: 'top', marginBottom: 16 },
});
