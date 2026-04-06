# Mobile Rules — Expo SDK 55 + React Native

## General

- La app mobile es SOLO para clientes. Trainers usan la web.
- `AuthContext` expone `role: UserRole` (`"client" | "trainer" | "admin" | null`).
- SVG icons: usar `react-native-svg` (Svg, Path, Circle). No emojis ni Text como iconos.
- Gradientes: `LinearGradient` de `expo-linear-gradient`.
- `expo-linear-gradient` ya está instalado.

## Theme

- `apps/mobile/src/theme.ts` re-exporta `colors`, `spacing`, `radius`, `fonts` desde `@fitos/theme`.
- `shadows` permanece local en theme.ts (usa APIs de React Native).
- `shadows.glow(color)` genera glow effect.
- `rgba` strings de `@fitos/theme` son solo para web. En RN usar `borderHex` + `StyleSheet opacity`.
- Para cambiar colores de marca: editar `packages/theme/src/index.ts` + `npm run sync-theme`.

## Metro Bundler

- `metro.config.js` tiene `watchFolders` apuntando a `../../packages`. Si se añaden paquetes compartidos, añadir al array.

## Realtime cleanup — patrón obligatorio

```ts
useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  const setup = async () => { channel = supabase.channel("...").on(...).subscribe(); };
  setup();
  return () => { if (channel) supabase.removeChannel(channel); };
}, []);
```
Nunca `return setup()` (retorna Promise, no cleanup).

## Widgets

- Android: `react-native-android-widget`. `TodayWorkoutWidget.tsx` usa primitivas `FlexWidget`, `TextWidget`, `ListWidget`. **Sin hooks** — funciones puras con props.
- iOS: WidgetKit (SwiftUI). Plugin `plugins/withIOSWidget.js`. Requiere `expo prebuild` + Xcode manual.
- Widget data sync: `src/lib/widget-data.ts` → AsyncStorage → `requestWidgetUpdate()`.
- Bundle identifiers: `ios: com.antigravity.fitos`, `android: com.antigravity.fitos`.

## Shared types

- Mobile `SetEntry.type` es required; shared es optional. No cambiar shared a required — rompería web.
- Tipos compartidos re-exportados desde `@fitos/shared` en `apps/mobile/src/screens/routine/types.ts`. No redefinir localmente (excepto `SetEntry`).
- Zonas anatómicas: importar `ZONE_LABELS` de `@fitos/shared`, no del deprecado `muscleData.ts`.

## Paridad web ↔ mobile

- OBLIGATORIA. Cualquier funcionalidad nueva o bugfix debe aplicarse en AMBAS plataformas.
- No cerrar tarea si solo está en una plataforma.
