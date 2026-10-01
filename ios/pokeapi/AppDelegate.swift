import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

/// Owns the React Native factory. The window is created by `SceneDelegate`:
/// iOS 27 requires apps to adopt the UIScene lifecycle.
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  /// Splash colour (#100B1E), same as LaunchScreen.storyboard, so there is no white flash
  /// between the launch screen and the first frame of the animated splash.
  static let splashBackground = UIColor(red: 16 / 255, green: 11 / 255, blue: 30 / 255, alpha: 1)

  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    rootView.backgroundColor = Self.splashBackground
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
