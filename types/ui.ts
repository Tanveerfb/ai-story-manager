/** Transient UI state (navbar visibility, floating toggle position). */
export type FloatingPosition = { x: number; y: number };

export type UIStore = {
  /** When true the global navbar is hidden and the floating reveal button shows. */
  navbarHidden: boolean;
  /** Viewport position of the floating reveal button (px from top-left). */
  togglePosition: FloatingPosition;
  setNavbarHidden: (hidden: boolean) => void;
  setTogglePosition: (position: FloatingPosition) => void;
};
