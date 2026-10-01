package com.pokeapi.nativemodules

import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.pokeapi.specs.NativeKeyValueStoreSpec
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * File-backed key/value store: one file per key under `filesDir/kv-store`.
 *
 * A single-thread executor keeps disk I/O off the JS thread and serializes
 * operations, so a read issued after a write always observes it.
 */
class KeyValueStoreModule(reactContext: ReactApplicationContext) :
  NativeKeyValueStoreSpec(reactContext) {

  private val ioExecutor: ExecutorService = Executors.newSingleThreadExecutor()

  private val directory: File by lazy {
    File(reactApplicationContext.filesDir, DIRECTORY_NAME).apply { mkdirs() }
  }

  override fun getName(): String = NAME

  override fun getItem(key: String, promise: Promise) = runIo(promise) {
    val file = fileFor(key)
    if (file.exists()) file.readText(Charsets.UTF_8) else null
  }

  override fun setItem(key: String, value: String, promise: Promise) = runIo(promise) {
    val target = fileFor(key)
    val temp = File(directory, "${target.name}.tmp")
    temp.writeText(value, Charsets.UTF_8)
    // Rename is atomic on the same filesystem: readers never see a half-written file.
    if (!temp.renameTo(target)) {
      temp.copyTo(target, overwrite = true)
      temp.delete()
    }
    null
  }

  override fun removeItem(key: String, promise: Promise) = runIo(promise) {
    fileFor(key).delete()
    null
  }

  override fun clear(promise: Promise) = runIo(promise) {
    directory.listFiles()?.forEach { it.delete() }
    null
  }

  override fun invalidate() {
    ioExecutor.shutdown()
    super.invalidate()
  }

  private fun fileFor(key: String): File {
    // Base64 URL-safe keeps any key a valid, collision-free file name.
    val encoded = Base64.encodeToString(
      key.toByteArray(Charsets.UTF_8),
      Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING,
    )
    return File(directory, encoded)
  }

  private fun runIo(promise: Promise, block: () -> Any?) {
    ioExecutor.execute {
      try {
        promise.resolve(block())
      } catch (error: Exception) {
        promise.reject(ERROR_CODE, error.message ?: "Key/value storage failure", error)
      }
    }
  }

  companion object {
    const val NAME = NativeKeyValueStoreSpec.NAME
    private const val DIRECTORY_NAME = "kv-store"
    private const val ERROR_CODE = "E_STORAGE"
  }
}
