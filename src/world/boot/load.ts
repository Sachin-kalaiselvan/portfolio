/**
 * Loads the world. The engine chunk and the physics WASM are fetched at the
 * same time; createWorld then finds Rapier already initialising.
 */
export const loadRuntime = () => {
  void import('../physics/Physics').then((m) => m.loadRapier()).catch(() => {
    /* createWorld reports the failure */
  });
  return import('../core/WorldRuntime');
};
