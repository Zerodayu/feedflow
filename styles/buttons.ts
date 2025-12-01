import { mainColors } from "@/utils/global-theme";
import { StyleSheet } from "react-native";

export const buttonS = StyleSheet.create({
  primary: {
    backgroundColor: mainColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: mainColors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    backgroundColor: mainColors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: mainColors.accent,
    borderRadius: mainColors.radius,
    alignItems: "center",
    justifyContent: "center",
  },
})
