import { makeElement } from "../common/element/element";

if (process.stdin.setRawMode) process.stdin.setRawMode(true);

type Key = "up" | "down" | "left" | "right";

const arrowMap = new Map<number, Key>([
  [65, "up"],
  [66, "down"],
  [67, "right"],
  [68, "left"],
]);

export type PressState = {
  [key in Key]: boolean;
};

export const onKey = (key: Key, callback: () => void) => {
  process.stdin.on("data", (data) => {
    const str = data.toString();
    if (str.length == 3) {
      if (str.charCodeAt(2) === arrowMap[key]) {
        callback();
      }
    }
  });
};

const initialState: PressState = {
  up: false,
  down: false,
  right: false,
  left: false,
};

const onMount = () => {
  process.stdin.on("data", (data) => {
    const str = data.toString();

    if (str === "\u0003") {
      process.exit();
    }

    if (str.length == 3) {
      const key = arrowMap.get(str.charCodeAt(2));

      if (key) {
        setInputState((draft) => {
          draft[key] = true;
        });
      }
    }
  });
};

const onTick = () => {
  setInputState(() => initialState);
};

const getKeyState = (key: Key) => getInputState()[key];

const {
  setState: setInputState,
  getState: getInputState,
  ...input
} = makeElement<PressState>({
  onMount,
  onTick,
  initialState,
});

export { input, getInputState, getKeyState };
