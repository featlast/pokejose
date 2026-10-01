/** Side of a shared-element transition an element plays. */
export enum SharedElementRole {
  /** Where the element starts when navigating forward (e.g. the list card image). */
  SOURCE = 'source',
  /** Where it lands on the pushed screen (e.g. the detail hero image). */
  TARGET = 'target',
}
