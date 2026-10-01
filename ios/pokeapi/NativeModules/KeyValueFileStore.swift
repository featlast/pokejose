import Foundation

/// File-backed key/value store: one file per key under `Application Support/kv-store`.
///
/// A serial queue keeps disk I/O off the JS thread and orders operations,
/// so a read issued after a write always observes it.
@objc(KeyValueFileStore)
public final class KeyValueFileStore: NSObject {
  private let queue = DispatchQueue(label: "com.pokeapi.kv-store", qos: .utility)
  private let fileManager = FileManager.default
  private let directory: URL

  @objc public override init() {
    let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    directory = base.appendingPathComponent("kv-store", isDirectory: true)
    super.init()
  }

  @objc public func getItem(_ key: String, completion: @escaping (String?, NSError?) -> Void) {
    perform(completion) { [self] in
      let url = try fileURL(for: key)
      guard fileManager.fileExists(atPath: url.path) else { return nil }
      return try String(contentsOf: url, encoding: .utf8)
    }
  }

  @objc public func setItem(_ key: String, value: String, completion: @escaping (NSError?) -> Void) {
    perform({ _, error in completion(error) }) { [self] in
      // `.atomic` writes to a temp file and renames it: readers never see partial data.
      try value.write(to: try fileURL(for: key), atomically: true, encoding: .utf8)
      return nil
    }
  }

  @objc public func removeItem(_ key: String, completion: @escaping (NSError?) -> Void) {
    perform({ _, error in completion(error) }) { [self] in
      let url = try fileURL(for: key)
      if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
      }
      return nil
    }
  }

  @objc public func clear(_ completion: @escaping (NSError?) -> Void) {
    perform({ _, error in completion(error) }) { [self] in
      if fileManager.fileExists(atPath: directory.path) {
        try fileManager.removeItem(at: directory)
      }
      return nil
    }
  }

  private func perform(
    _ completion: @escaping (String?, NSError?) -> Void,
    _ work: @escaping () throws -> String?
  ) {
    queue.async {
      do {
        completion(try work(), nil)
      } catch {
        completion(nil, error as NSError)
      }
    }
  }

  /// Creates the store directory once, excluded from iCloud backup: it only holds
  /// re-downloadable cache data (Apple's data storage guidelines).
  private func ensureDirectory() throws {
    guard !fileManager.fileExists(atPath: directory.path) else { return }
    try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    var url = directory
    try url.setResourceValues(values)
  }

  private func fileURL(for key: String) throws -> URL {
    try ensureDirectory()
    // Base64 URL-safe keeps any key a valid, collision-free file name.
    let encoded = Data(key.utf8).base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
    return directory.appendingPathComponent(encoded, isDirectory: false)
  }
}
