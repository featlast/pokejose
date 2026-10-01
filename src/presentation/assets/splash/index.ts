/**
 * Layers of the Lumen sphere rendered in Blender.
 * Every sphere layer shares one square canvas centred on the sphere.
 */
import backdrop from './backdrop.jpg';
import bottom from './bottom.png';
import burst from './burst.png';
import button from './button.png';
import buttonRed from './button_red.png';
import buttonWhite from './button_white.png';
import core from './core.png';
import seam from './seam.png';
import shadow from './shadow.png';
import top from './top.png';

export const splashImages = {
  backdrop,
  bottom,
  burst,
  button,
  buttonRed,
  buttonWhite,
  core,
  seam,
  shadow,
  top,
} as const;
