package com.pokeapi.nativemodules

import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.pokeapi.specs.NativeSafeAreaSpec

/**
 * Exposes system bar + display cutout insets in dp. Needed because the app
 * renders edge-to-edge and the core SafeAreaView is deprecated.
 */
class SafeAreaModule(reactContext: ReactApplicationContext) :
  NativeSafeAreaSpec(reactContext) {

  override fun getName(): String = NAME

  override fun getInsets(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val decorView = reactApplicationContext.currentActivity?.window?.decorView
        val insets = decorView
          ?.let { ViewCompat.getRootWindowInsets(it) }
          ?.getInsets(
            WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
          )
        if (insets == null) {
          // Not attached yet: let JS fall back / retry instead of trusting zeros.
          promise.reject("E_SAFE_AREA_UNAVAILABLE", "Window insets are not available yet")
          return@runOnUiThread
        }
        val density = reactApplicationContext.resources.displayMetrics.density.toDouble()

        val result = Arguments.createMap().apply {
          putDouble("top", insets.top / density)
          putDouble("right", insets.right / density)
          putDouble("bottom", insets.bottom / density)
          putDouble("left", insets.left / density)
        }
        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("E_SAFE_AREA", error.message, error)
      }
    }
  }

  companion object {
    const val NAME = NativeSafeAreaSpec.NAME
  }
}
