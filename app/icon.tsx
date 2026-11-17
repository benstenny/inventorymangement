import { renderIcon } from "./icons/render-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Browser tab icon, same hanger as the app icon. */
export default function Icon() {
  return renderIcon(32, 0.1);
}
