import { makeElement } from "../common/element";

type TimerState = {
  intervals: {
    [key: string]: number;
  };
  callbacks: {
    [key: string]: Function;
  };
};

const initialState: TimerState = {
  intervals: {},
  callbacks: {},
};

const tickTimers = () =>
  setTimerState((draft) => {
    for (const key in draft.intervals)
      draft.intervals[key] = Math.max(0, draft.intervals[key] - 1);
  });

const runTimerCallbacks = () => {
  const { intervals, callbacks } = getTimerState();
  for (const key in intervals) {
    if (intervals[key] === 0) {
      callbacks[key]();
      stopTimer(key);
    }
  }
};

const onTick = () => {
  tickTimers();
  runTimerCallbacks();
};

const {
  setState: setTimerState,
  getState: getTimerState,
  ...timers
} = makeElement<TimerState>({
  onTick,
  initialState,
});

export const setTimer = (key: string, tickCount: number, callback?: Function) =>
  setTimerState((draft) => {
    draft.intervals[key] = Math.max(0, tickCount);
    if (callback) draft.callbacks[key] = callback;
  });

export const stopTimer = (key: string) =>
  setTimerState((draft) => {
    delete draft.intervals[key];
    delete draft.callbacks[key];
  });

export const hasTimer = (key: string) =>
  typeof getTimerState().intervals[key] !== "undefined";

export { timers };
