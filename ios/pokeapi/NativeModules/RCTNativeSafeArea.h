#import <Foundation/Foundation.h>
#import <PokedexSpecs/PokedexSpecs.h>

NS_ASSUME_NONNULL_BEGIN

/// TurboModule bridge for `NativeSafeArea`; the logic lives in SafeAreaReader.swift.
@interface RCTNativeSafeArea : NSObject <NativeSafeAreaSpec>
@end

NS_ASSUME_NONNULL_END
