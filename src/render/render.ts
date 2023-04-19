import { makeElement } from "../common/element";
import { getGameState } from "../game";

type RenderBuffer = string[][];

type RenderState = {
  resolution: {
    lines: number;
    cols: number;
  };
  buffer: RenderBuffer;
};

const onTick = () => {
  console.clear();
  updateRenderState();
  renderBoard();
  renderBuffer();
};

const initialState: RenderState = {
  resolution: {
    lines: 0,
    cols: 0,
  },
  buffer: [[]],
};

const updateRenderState = () => {
  const lines = process.stdout.rows;
  const cols = process.stdout.columns;

  setRenderState((draft) => {
    draft.resolution.lines = lines;
    draft.resolution.cols = cols;
  });
};

const renderBuffer = () => {
  const { buffer } = getRenderState();

  buffer.forEach((line) => {
    console.log(line.join(""));
  });
};

const renderBoard = () => {
  const { board } = getGameState();

  const buffer = board.map((line) => {
    return line.flatMap((cell) => {
      return cell === 0 ? [" ", " "] : ["█", "█"];
    });
  });

  setRenderState((draft) => {
    draft.buffer = buffer;
  });
};

const {
  setState: setRenderState,
  getState: getRenderState,
  ...render
} = makeElement<RenderState>({
  onTick,
  initialState,
});

export { render };
