import { produce } from "immer";

export type ElementConstructor<S> = {
  onMount?: () => void;
  onUnmount?: () => void;
  onTick?: () => void;
  initialState?: S;
};

export type Element<S> = {
  mount: () => void;
  unmount: () => void;
  tick: () => void;
  getState: () => S;
  setState: (fn: (draft: S) => S | void | undefined) => void;
};

export const makeElement = <S>(
  constructor: ElementConstructor<S>
): Element<S> => {
  let mounted = false;
  let state = constructor.initialState;

  const mount = () => {
    mounted = true;
    if (constructor.onMount) constructor.onMount();
  };

  const unmount = () => {
    mounted = false;
    if (constructor.onUnmount) constructor.onUnmount();
  };

  const tick = () => {
    if (!mounted) return;
    if (constructor.onTick) constructor.onTick();
  };

  const getState = () => (mounted ? state : constructor.initialState) as S;

  const setState = (fn: (draft: S) => S | void | undefined) => {
    if (!mounted) return;
    state = produce(state, fn);
  };

  return {
    mount,
    unmount,
    tick,
    getState,
    setState,
  };
};
