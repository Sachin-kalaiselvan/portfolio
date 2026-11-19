import type { NavigationType } from 'react-router-dom';

/** True once the visitor has navigated client-side. The first, prerendered page never animates in. */
let navigated = false;
export const hasNavigated = () => navigated;
export const markNavigated = () => {
  navigated = true;
};

/**
 * The real navigation type. Pages render inside <Routes location={...}>, which
 * always reports POP, so App records the true value here for scroll restoration.
 */
let navType: NavigationType | 'POP' = 'POP';
export const setNavType = (t: NavigationType) => {
  navType = t;
};
export const getNavType = () => navType;
