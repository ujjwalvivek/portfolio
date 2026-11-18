// Home (ADR M1, M2): the header scene, then the sections below it, each mounted lazily as it nears the viewport.

import { mountLazySections } from "../lib/lazy.js";
import { mount as mountHeader } from "../features/header-game.js";
import { mount as mountIntro } from "../features/intro.js";

export function mount(root: HTMLElement): () => void {
  const undo = [mountHeader(root), mountIntro(root), mountLazySections(root)];
  return () => undo.forEach((u) => u());
}
