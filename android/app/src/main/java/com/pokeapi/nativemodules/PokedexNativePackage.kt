package com.pokeapi.nativemodules

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Registers the app's own TurboModules with the React host. */
class PokedexNativePackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      KeyValueStoreModule.NAME -> KeyValueStoreModule(reactContext)
      SafeAreaModule.NAME -> SafeAreaModule(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    listOf(KeyValueStoreModule.NAME, SafeAreaModule.NAME).associateWith { name ->
      ReactModuleInfo(
        name = name,
        className = name,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true,
      )
    }
  }
}
