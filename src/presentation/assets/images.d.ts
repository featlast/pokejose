/** Metro resolves image imports to an asset id usable as an `Image` source. */
declare module '*.png' {
  const asset: number;
  export default asset;
}

declare module '*.jpg' {
  const asset: number;
  export default asset;
}
