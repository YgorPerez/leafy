import { Platform } from "react-native";
import Reactotron from "reactotron-react-native";

/**
 * Reactotron configuration for debugging React Native apps.
 *
 * Features:
 * - Console logging
 * - Network request monitoring
 * - Async storage inspection
 * - State snapshots
 *
 * @see https://docs.infinite.red/reactotron/
 */

// Only configure Reactotron in development
if (__DEV__) {
  Reactotron.configure({
    name: "Leafy",
    // Use localhost for iOS simulator, 10.0.2.2 for Android emulator
    host: Platform.OS === "android" ? "10.0.2.2" : "localhost",
  })
    .useReactNative({
      asyncStorage: false, // We're using MMKV instead
      networking: {
        ignoreUrls: /symbolicate|127\.0\.0\.1/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .connect();

  // Extend console to log to Reactotron
  const originalConsoleLog = console.log;
  console.log = (...args: unknown[]) => {
    originalConsoleLog.apply(console, args);
    if (Reactotron.log) {
      Reactotron.log(args);
    }
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    originalConsoleWarn.apply(console, args);
    if (Reactotron.warn) {
      Reactotron.warn(args);
    }
  };

  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    originalConsoleError.apply(console, args);
    if (Reactotron.error) {
      Reactotron.error(String(args[0]), args.slice(1));
    }
  };
}

export default Reactotron;
