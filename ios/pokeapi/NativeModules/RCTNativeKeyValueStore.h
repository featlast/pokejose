#import <Foundation/Foundation.h>
#import <PokedexSpecs/PokedexSpecs.h>

NS_ASSUME_NONNULL_BEGIN

/// TurboModule bridge for `NativeKeyValueStore`; the logic lives in KeyValueFileStore.swift.
@interface RCTNativeKeyValueStore : NSObject <NativeKeyValueStoreSpec>
@end

NS_ASSUME_NONNULL_END
