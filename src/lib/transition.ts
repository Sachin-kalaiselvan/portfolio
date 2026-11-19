/** True once the visitor has navigated client-side. The first, prerendered page never animates in. */
let navigated = false;
export const hasNavigated = () => navigated;
export const markNavigated = () => {
  navigated = true;
};
