#import "RCTNativeSafeArea.h"

#import "PokedexSwiftBridge.h"

@implementation RCTNativeSafeArea

+ (NSString *)moduleName
{
  return @"NativeSafeArea";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSafeAreaSpecJSI>(params);
}

- (void)getInsets:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  // UIKit must be read on the main thread.
  dispatch_async(dispatch_get_main_queue(), ^{
    NSValue *value = [SafeAreaReader currentInsets];
    if (value == nil) {
      reject(@"E_SAFE_AREA_UNAVAILABLE", @"No key window is available yet", nil);
      return;
    }
    UIEdgeInsets insets = value.UIEdgeInsetsValue;
    resolve(@{
      @"top" : @(insets.top),
      @"right" : @(insets.right),
      @"bottom" : @(insets.bottom),
      @"left" : @(insets.left),
    });
  });
}

@end
