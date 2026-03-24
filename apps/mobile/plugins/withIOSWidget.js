/**
 * Expo Config Plugin — iOS WidgetKit Extension
 *
 * Generates a WidgetKit extension target during `expo prebuild`.
 * The widget reads today's workout from App Group shared UserDefaults.
 *
 * Requirements:
 * - Bundle identifier set (com.antigravity.fitos)
 * - App Group: group.com.antigravity.fitos.widget
 * - Run `expo prebuild` to generate native projects
 */
const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
  IOSConfig,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const WIDGET_BUNDLE_ID = "com.antigravity.fitos.TodayWorkoutWidget";
const APP_GROUP = "group.com.antigravity.fitos.widget";
const WIDGET_TARGET_NAME = "TodayWorkoutWidget";

/**
 * Add App Groups entitlement to the main app
 */
function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.security.application-groups"] = [APP_GROUP];
    return mod;
  });
}

/**
 * Write the Swift widget source files into the ios/ directory
 */
function writeWidgetFiles(projectRoot) {
  const widgetDir = path.join(projectRoot, "ios", WIDGET_TARGET_NAME);

  if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
  }

  // Main widget Swift file
  const widgetSwift = `
import WidgetKit
import SwiftUI

// MARK: - Data Model

struct WorkoutExercise: Codable, Identifiable {
    let name: String
    let scheme: String
    let completed: Bool
    var id: String { name }
}

struct WidgetWorkoutData: Codable {
    let dayName: String
    let dayLabel: String
    let exercises: [WorkoutExercise]
    let isRestDay: Bool
    let routineTitle: String
    let totalExercises: Int
    let completedExercises: Int
    let lastUpdated: String
}

// MARK: - Timeline Provider

struct WorkoutTimelineProvider: TimelineProvider {
    let appGroup = "${APP_GROUP}"

    func placeholder(in context: Context) -> WorkoutEntry {
        WorkoutEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (WorkoutEntry) -> Void) {
        let data = loadWidgetData()
        completion(WorkoutEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WorkoutEntry>) -> Void) {
        let data = loadWidgetData()
        let entry = WorkoutEntry(date: Date(), data: data)

        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadWidgetData() -> WidgetWorkoutData? {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let jsonString = defaults.string(forKey: "widget-today-workout"),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetWorkoutData.self, from: jsonData)
    }
}

// MARK: - Timeline Entry

struct WorkoutEntry: TimelineEntry {
    let date: Date
    let data: WidgetWorkoutData?
}

// MARK: - Widget Views

struct TodayWorkoutWidgetEntryView: View {
    var entry: WorkoutTimelineProvider.Entry
    @Environment(\\.widgetFamily) var family

    var body: some View {
        if let data = entry.data {
            workoutView(data: data)
        } else {
            placeholderView
        }
    }

    var placeholderView: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("FitOS")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .tracking(2)
                    .foregroundColor(Color(hex: "00E5FF"))
                Spacer()
            }
            Text("Abre FitOS")
                .font(.headline)
                .fontWeight(.black)
                .foregroundColor(Color(hex: "E8E8ED"))
            Text("para sincronizar tu rutina")
                .font(.caption)
                .foregroundColor(Color(hex: "5A5A72"))
            Spacer()
        }
        .padding()
        .background(Color(hex: "0A0A0F"))
    }

    func workoutView(data: WidgetWorkoutData) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("FitOS")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(2)
                        .foregroundColor(Color(hex: "00E5FF"))
                    Text(data.dayName)
                        .font(.system(size: 18, weight: .black))
                        .tracking(-0.5)
                        .foregroundColor(Color(hex: "E8E8ED"))
                }
                Spacer()
                if !data.isRestDay && data.totalExercises > 0 {
                    let allDone = data.completedExercises >= data.totalExercises
                    Text(allDone ? "COMPLETADO" : "\\(data.totalExercises) ejercicios")
                        .font(.system(size: 9, weight: .bold))
                        .tracking(0.5)
                        .foregroundColor(allDone ? Color(hex: "0A0A0F") : Color(hex: "00E5FF"))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(allDone ? Color(hex: "00C853") : Color(hex: "00E5FF").opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }

            // Day label
            if !data.dayLabel.isEmpty {
                Text(data.dayLabel)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "8B8BA3"))
            }

            // Content
            if data.isRestDay {
                Spacer()
                VStack(spacing: 2) {
                    Text("Día de descanso")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(hex: "5A5A72"))
                    Text("Recupera y vuelve más fuerte")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "5A5A72"))
                }
                .frame(maxWidth: .infinity)
                Spacer()
            } else {
                exerciseList(exercises: data.exercises)
            }
        }
        .padding(14)
        .background(Color(hex: "0A0A0F"))
    }

    func exerciseList(exercises: [WorkoutExercise]) -> some View {
        let maxItems = family == .systemSmall ? 3 : 6

        return VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(exercises.prefix(maxItems).enumerated()), id: \\.offset) { index, ex in
                HStack(spacing: 8) {
                    // Number circle
                    ZStack {
                        Circle()
                            .fill(ex.completed ? Color(hex: "00C853") : Color(hex: "12121A"))
                            .frame(width: 20, height: 20)
                        Text(ex.completed ? "✓" : "\\(index + 1)")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(ex.completed ? Color(hex: "0A0A0F") : Color(hex: "8B8BA3"))
                    }

                    Text(ex.name)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(ex.completed ? Color(hex: "5A5A72") : Color(hex: "E8E8ED"))
                        .lineLimit(1)

                    Spacer()

                    Text(ex.scheme)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "00E5FF"))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: "12121A"))
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
                .padding(.vertical, 4)
            }

            if exercises.count > maxItems {
                Text("+\\(exercises.count - maxItems) más")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Color(hex: "5A5A72"))
                    .padding(.top, 2)
            }
        }
    }
}

// MARK: - Widget Definition

@main
struct TodayWorkoutWidgetBundle: Widget {
    let kind: String = "TodayWorkoutWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WorkoutTimelineProvider()) { entry in
            TodayWorkoutWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Entrenamiento del día")
        .description("Ve tu entrenamiento de hoy sin abrir FitOS.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
`;

  fs.writeFileSync(path.join(widgetDir, "TodayWorkoutWidget.swift"), widgetSwift.trim());

  // Widget entitlements
  const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>`;

  fs.writeFileSync(path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`), entitlements);

  // Info.plist for the widget extension
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>es</string>
    <key>CFBundleDisplayName</key>
    <string>FitOS Widget</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${WIDGET_BUNDLE_ID}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>`;

  fs.writeFileSync(path.join(widgetDir, "Info.plist"), infoPlist);
}

/**
 * Add the widget extension target to the Xcode project
 */
function withWidgetTarget(config) {
  return withXcodeProject(config, async (mod) => {
    const projectRoot = mod.modRequest.projectRoot;
    writeWidgetFiles(projectRoot);

    // The actual Xcode target setup would be done by the build system.
    // For a full native build, add the widget target manually in Xcode
    // or use EAS Build with a custom plugin.
    // This plugin generates the Swift source files so they're ready.
    console.log(
      `[withIOSWidget] Widget Swift files written to ios/${WIDGET_TARGET_NAME}/`
    );
    console.log(
      `[withIOSWidget] To complete iOS widget setup:\n` +
      `  1. Open ios/*.xcworkspace in Xcode\n` +
      `  2. File → New → Target → Widget Extension\n` +
      `  3. Name: ${WIDGET_TARGET_NAME}\n` +
      `  4. Replace generated Swift with ios/${WIDGET_TARGET_NAME}/TodayWorkoutWidget.swift\n` +
      `  5. Add App Group: ${APP_GROUP} to both main app and widget targets\n` +
      `  6. Build & run`
    );

    return mod;
  });
}

/**
 * Main plugin entry
 */
function withIOSWidget(config) {
  config = withAppGroupEntitlement(config);
  config = withWidgetTarget(config);
  return config;
}

module.exports = withIOSWidget;
