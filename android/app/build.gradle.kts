plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.goodsamaritan.speedtyping"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.goodsamaritan.speedtyping"
        minSdk = 23
        targetSdk = 34
        versionCode = providers.gradleProperty("versionCode").orElse("1").get().toInt()
        versionName = providers.gradleProperty("versionName").orElse("1.0").get()
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ""
        }
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
