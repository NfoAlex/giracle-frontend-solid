import type { NavigateOptions } from "@solidjs/router";

type NavigateEvent = {
  to: string;
  options?: Partial<NavigateOptions>;
};
type NavigateFunc = (event: NavigateEvent) => void;

/**
 * Router外でもページ遷移を行うための関数群
 */
export const ExternalNavigater: {
  receiver: undefined | NavigateFunc;
  bind: (sink: NavigateFunc) => void;
  unbind: () => void;
  navi: NavigateFunc;
} = {
  receiver: undefined,
  bind: (func: (event: NavigateEvent) => void) => {
    ExternalNavigater.receiver = func;
  },
  unbind: () => {
    ExternalNavigater.receiver = undefined;
  },
  navi: (event: NavigateEvent) => ExternalNavigater.receiver?.(event),
};