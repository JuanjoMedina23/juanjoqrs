export default {
  expo: {
    name: "juanjoqrs",
    slug: "juanjoqrs",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "juanjoqrs",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Otorga permiso para que la app pueda usar la camara :)",
        NSUserNotificationUsageDescription: "Necesitamos enviarte notificaciones importantes",
        NSLocationWhenInUseUsageDescription: "Permite mostrar tu ubicación en el mapa.",
        NSPhotoLibraryUsageDescription: "Permite acceder a tu galería para cambiar tu foto de perfil.",
      },
    },
    android: {
      permissions: [
        "CAMERA",
        "NOTIFICATIONS",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
      ],
      config: {
        googleMaps: {
          apiKey: "AIzaSyDSicTCjOSDT6s6kAWekwp-CqyD_4BSFkA",
        },
      },
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.sebaevng.juanjoqrs",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          recordAudioPermission: false,
          cameraPermission: "Otorga permiso para que la app pueda usar la camara :)",
        },
      ],
      "expo-notifications",
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Permite mostrar tu ubicación en el mapa.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Permite acceder a tu galería para cambiar tu foto de perfil.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "e35daf56-48a9-46b0-b803-2470d708d766",
      },
    },
  },
};