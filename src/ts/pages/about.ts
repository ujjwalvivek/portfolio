// About (ADR M5): v3's About page. The HTML holds every block at its final size; this mounts the behaviour.
// The intro clock, the troopers, the recent-project overlays, the resume bar and the easter egg's door mount at once
// (they are small). The engine cards and the languages tide moved to home.

import { mount as mountIntro } from "../features/about-intro.js";
import { mount as mountTrooper } from "../features/about-trooper.js";
import { mount as mountResume } from "../features/about-resume.js";
import { mount as mountRecent } from "../features/about-recent.js";
import { mount as mountEggDoor } from "../features/about-egg-door.js";

export function mount(root: HTMLElement): () => void {
  const undo: (() => void)[] = [mountIntro(root), mountTrooper(root), mountRecent(root), mountResume(root), mountEggDoor(root)];
  return () => undo.forEach((u) => u());
}
