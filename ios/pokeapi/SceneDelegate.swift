import UIKit

/// Creates the app window for the connected scene and mounts React Native in it.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate
    else { return }

    let window = UIWindow(windowScene: windowScene)
    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "pokeapi",
      in: window,
      launchOptions: nil
    )
    // Some React Native internals still look up the window through the app delegate.
    appDelegate.window = window
    self.window = window
  }
}
