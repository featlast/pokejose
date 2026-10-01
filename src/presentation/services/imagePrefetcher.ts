import { Image } from 'react-native';

export type ImagePrefetcher = (uris: readonly string[]) => void;

/** Warms the native image cache (Fresco / NSURLCache); failures are irrelevant. */
export const prefetchImages: ImagePrefetcher = uris => {
  uris.forEach(uri => {
    Image.prefetch(uri).catch(() => undefined);
  });
};
