import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { fonts } from "../theme";

export interface CustomTextProps extends TextProps {
  variant?: "title" | "button" | "body";
}

export function Text({ style, variant = "body", ...props }: CustomTextProps) {
  let mappedStyle: any = { fontFamily: fonts.regular };

  // Note: we let explicit weights pass through dynamically, but in RN, 
  // setting fontWeight alongside a modern custom font might cause issues unless
  // it maps strictly. For safety, we map specific variants requested.
  if (variant === "title") {
    mappedStyle = {
      fontFamily: fonts.extraBold,
      letterSpacing: -0.02 * 16, // Approx conversion assuming 16px base if relative em isn't supported inside Text without explicit sizes, but RN supports letterSpacing
    };
  } else if (variant === "button") {
    mappedStyle = {
      fontFamily: fonts.medium,
    };
  } else {
    // If it's just 'body', we can parse explicit fontWeights from style and remap it
    const flattened = StyleSheet.flatten(style) || {};
    if (flattened.fontWeight) {
      const weight = flattened.fontWeight.toString();
      if (weight.includes("bold") || weight >= "700") {
        mappedStyle.fontFamily = fonts.bold;
        if (weight >= "800") mappedStyle.fontFamily = fonts.extraBold;
      } else if (weight >= "500") {
        mappedStyle.fontFamily = fonts.medium;
      }
      // Usually, when using custom fonts in Expo, providing fontWeight 
      // parallel to fontFamily can reset it to system font on Android. 
      // So we might need to delete fontWeight from flattened...
      // but modifying user's style array is complex.
    }
  }

  // A cleaner approach: just override the generic fontFamily and let the user specify titles and buttons
  return (
    <RNText
      {...props}
      style={[
        { fontFamily: fonts.regular },
        variant === "title" && { fontFamily: fonts.extraBold, letterSpacing: -0.5 },
        variant === "button" && { fontFamily: fonts.medium },
        style,
        // Hack for Android mapping custom fonts:
        style ? { fontWeight: undefined } : undefined
      ].filter(Boolean)}
    />
  );
}
