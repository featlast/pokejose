// Exposes the app's Swift classes to Objective-C++ TurboModule wrappers.
//
// Objective-C++ cannot use `@import`, so every type referenced by the generated
// `pokeapi-Swift.h` (including AppDelegate's React delegate superclass) must be
// imported explicitly before it.
#pragma once

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#if __has_include(<React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>)
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#else
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#endif

#import "pokeapi-Swift.h"
