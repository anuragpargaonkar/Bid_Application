import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375;
export const responsive = (size: number) => Math.round(size * scale);

export const COLORS = {
  primary: '#262a4f',
  secondary: '#a9acd6',
  background: '#f5f6fa',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textGray: '#374151',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingBottom: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    elevation: 8,
    backgroundColor: COLORS.white,
    shadowColor: '#64748B',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: 40, height: 40, tintColor: '#fff' },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerTitle: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  subTitle: { color: COLORS.secondary, fontSize: 12, marginTop: 2 },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

  mainTabs: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: '#e9e9f2',
    borderRadius: 30,
    padding: 4,
  },
  mainTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: 'center',
  },
  mainTabText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  activeMainTab: { backgroundColor: COLORS.primary },
  activeMainTabText: { color: '#fff', fontWeight: '700' },

  subTabsContainer: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: '#e9e9f2',
    borderRadius: 30,
    padding: 4,
  },
  subTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  subTabText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  activeSubTab: { backgroundColor: COLORS.primary },
  activeSubTabText: { color: '#fff', fontWeight: '700' },

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive(20),
  },
  title: {
    fontSize: responsive(16),
    fontWeight: '600',
    marginTop: responsive(8),
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: responsive(13),
    color: '#777',
    textAlign: 'center',
    marginTop: responsive(4),
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsive(30),
    paddingVertical: responsive(10),
    borderRadius: responsive(25),
    marginTop: responsive(20),
  },
  homeButtonText: { color: '#fff', fontWeight: '700', fontSize: responsive(16) },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: responsive(16),
    padding: responsive(10),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lostDate: {
    fontSize: responsive(12),
    color: COLORS.primary,
    marginBottom: responsive(6),
    fontWeight: 'bold',
  },
  cardContent: { flexDirection: 'row' },
  cardImage: {
    width: responsive(80),
    height: responsive(60),
    borderRadius: responsive(8),
  },
  carTitle: { fontSize: responsive(15), fontWeight: '600', color: COLORS.primary },
  carPrice: { color: '#000', marginVertical: responsive(4), fontWeight: '700' },
  carId: { fontSize: responsive(12), color: '#777' },

  procuredContainer: { flex: 1, padding: responsive(16) },
  procuredBox: {
    backgroundColor: '#fff',
    borderRadius: responsive(12),
    overflow: 'hidden',
    marginBottom: responsive(20),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  procuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  procuredRowHighlight: { backgroundColor: COLORS.secondary, borderBottomWidth: 0 },
  procuredLabel: { fontSize: responsive(14), color: COLORS.primary },
  procuredAmount: { fontWeight: 'bold', color: COLORS.primary },
  disabledRefreshButton: {
    marginTop: responsive(20),
    backgroundColor: COLORS.primary,
    paddingVertical: responsive(10),
    paddingHorizontal: responsive(20),
    borderRadius: responsive(25),
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledRefreshText: { color: '#fff', fontWeight: '700' },
});

export default styles;
