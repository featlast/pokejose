/** A view's frame in window coordinates, as returned by `measureInWindow`. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** What a route shares with the screen below it: the element key and the image to fly. */
export type SharedElementSpec = {
  key: string;
  uri: string;
};

/** One flight of the overlay image between two measured frames. */
export type Flight = {
  uri: string;
  from: Rect;
  to: Rect;
};
