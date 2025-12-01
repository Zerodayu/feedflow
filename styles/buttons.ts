import { mainColors } from "@/utils/global-theme";
import { StyleSheet } from "react-native";

export const buttonS = StyleSheet.create({
  primary: {
    backgroundColor: mainColors.primary,
    paddingVertical: mainColors.sm,
    paddingHorizontal: mainColors.md,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: mainColors.accent,
    paddingVertical: mainColors.md,
    paddingHorizontal: mainColors.lg,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    backgroundColor: mainColors.secondary,
    paddingVertical: mainColors.md,
    paddingHorizontal: mainColors.lg,
    borderWidth: 1,
    color: mainColors.accentForeground,
    borderColor: mainColors.accent,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    backgroundColor: "transparent",
    paddingVertical: mainColors.md,
    paddingHorizontal: mainColors.lg,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  destructive: {
    backgroundColor: mainColors.destructive,
    paddingVertical: mainColors.md,
    paddingHorizontal: mainColors.lg,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
})
