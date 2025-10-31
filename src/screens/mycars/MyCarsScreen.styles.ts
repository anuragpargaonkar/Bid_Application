import { StyleSheet } from "react-native";

export const COLORS = {
  primary: "#262a4f",
  secondary: "#a9acd6",
  background: "#f5f6fa",
  white: "#FFFFFF",
  textDark: "#0F172A",
  textGray: "#374151",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingBottom: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    elevation: 8,
    backgroundColor: COLORS.white,
    shadowColor: "#64748B",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  logoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: "700",
  },
  subTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: { fontSize: 18, fontWeight: "700", color: COLORS.primary },

  tabRow: {
    flexDirection: "row",
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: "#e9e9f2",
    borderRadius: 30,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "700",
  },
  wishlistBadge: {
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  wishlistBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  carImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  heartIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#00000060",
    borderRadius: 20,
    padding: 6,
  },
  scrapBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#e63946",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scrapText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardDetails: { padding: 10 },
  carName: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationTextSmall: { fontSize: 12, color: "#666", marginLeft: 4 },
  carInfo: { fontSize: 12, color: "#777", marginTop: 4 },

  bidSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  highestBid: { fontSize: 12, color: "#777" },
  bidAmount: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  timerContainer: { flexDirection: "row", alignItems: "center" },
  timeRemaining: { fontSize: 10, color: "#777", marginRight: 4 },
  timerBox: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    color: COLORS.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 4,
  },
});

export default styles;
