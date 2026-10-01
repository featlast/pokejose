#import "RCTNativeKeyValueStore.h"

#import "PokedexSwiftBridge.h"

static NSString *const kStorageErrorCode = @"E_STORAGE";

@implementation RCTNativeKeyValueStore {
  KeyValueFileStore *_store;
}

- (instancetype)init
{
  if (self = [super init]) {
    _store = [KeyValueFileStore new];
  }
  return self;
}

+ (NSString *)moduleName
{
  return @"NativeKeyValueStore";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeKeyValueStoreSpecJSI>(params);
}

- (void)getItem:(NSString *)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_store getItem:key
       completion:^(NSString *_Nullable value, NSError *_Nullable error) {
         if (error != nil) {
           reject(kStorageErrorCode, error.localizedDescription, error);
           return;
         }
         resolve(value ?: (id)[NSNull null]);
       }];
}

- (void)setItem:(NSString *)key
          value:(NSString *)value
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [_store setItem:key
            value:value
       completion:^(NSError *_Nullable error) {
         error != nil ? reject(kStorageErrorCode, error.localizedDescription, error) : resolve(nil);
       }];
}

- (void)removeItem:(NSString *)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_store removeItem:key
          completion:^(NSError *_Nullable error) {
            error != nil ? reject(kStorageErrorCode, error.localizedDescription, error) : resolve(nil);
          }];
}

- (void)clear:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_store clear:^(NSError *_Nullable error) {
    error != nil ? reject(kStorageErrorCode, error.localizedDescription, error) : resolve(nil);
  }];
}

@end
