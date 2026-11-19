// Home (ADR M1, M2): the header scene, then the sections below it (recent logs, the engines, widgets, mail), each mounted lazily as it nears the viewport.

import { lazySection, mountLazySections } from "../lib/lazy.js";
import { mount as mountHeader } from "../features/header-game.js";
import { mount as mountIntro } from "../features/intro.js";

export function mount(root: HTMLElement): () => void {
  const undo = [mountHeader(root), mountIntro(root), mountLazySections(root)];
  // the two engines this site runs on: drawn at final size, live numbers fetched near the viewport
  const engines = root.querySelector<HTMLElement>(".ab-engines");
  if (engines) undo.push(lazySection(engines, "/js/features/about-engines.js"));
  return () => undo.forEach((u) => u());
}
