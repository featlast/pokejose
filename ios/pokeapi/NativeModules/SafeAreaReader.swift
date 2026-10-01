import UIKit

/// Reads the key window's safe-area insets (points). Must be called on the main thread.
@objc(SafeAreaReader)
public final class SafeAreaReader: NSObject {
  /// Returns nil when no window is attached yet, so callers can fall back instead of using zeros.
  @objc public static func currentInsets() -> NSValue? {
    guard let window = keyWindow() else { return nil }
    return NSValue(uiEdgeInsets: window.safeAreaInsets)
  }

  private static func keyWindow() -> UIWindow? {
    let windows = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
    return windows.first(where: \.isKeyWindow)
      ?? windows.first
      ?? UIApplication.shared.delegate?.window ?? nil
  }
}
