import { makeElement } from "../common/element/element";
import { getKeyState } from "../input";
import { hasTimer, setTimer, stopTimer } from "../timer/timer";
import { CLEAN_BOARD, GameBoard } from "./board";
import { PIECES, PIECE_ROTATIONS, PieceType } from "./pieces";

const UPDATE_POS_TIMER = "update-pos-timer";

type XY = {
  x: number;
  y: number;
};

type Rotation = 0 | 1 | 2 | 3;

type GamePieceBase = XY & {
  type: PieceType;
  rotation: Rotation;
};

type Coord = [number, number];

type GamePiece = GamePieceBase & {
  activeCoords: Coord[];
};

export type GameState = {
  board: GameBoard;
  staticBoard: GameBoard;
  gameSpeed: 0;
  lockDelay: boolean;
  piece?: GamePiece | null;
};

const initialState: GameState = {
  board: CLEAN_BOARD,
  staticBoard: CLEAN_BOARD,
  gameSpeed: 0,
  lockDelay: false,
};

const onMount = () => {
  updateToNewPiece();
};

const onTick = () => {
  const { piece, gameSpeed } = getGameState();

  console.log(piece);

  if (!piece) return;

  if (!hasTimer(UPDATE_POS_TIMER)) {
    setTimer(UPDATE_POS_TIMER, 20 - gameSpeed, moveVertically);
  }

  listenInput();
  updateBoard();
  clearLines();
};

const {
  setState: setGameState,
  getState: getGameState,
  ...game
} = makeElement({
  onMount,
  onTick,
  initialState,
});

const updateToNewPiece = () => {
  setGameState((draft) => {
    draft.piece = makePiece(getRandomPiece());
  });
};

const updateBoard = () => {
  const { piece, staticBoard } = getGameState();

  if (!piece) return;

  setGameState((draft) => {
    draft.board = composeBoard(staticBoard, piece.activeCoords);
  });
};

const clearLines = () => {
  setGameState((draft) => {
    for (const key in draft.board) {
      const line = draft.board[key];
      if (line.every((cell) => cell === 1)) {
        draft.board.splice(Number(key), 1);
        draft.board.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
    }
  });
};

const getRandomPiece = (): PieceType => {
  const index = Math.floor(Math.random() * PIECES.length);
  return PIECES[index];
};

const composeBoard = (board: GameBoard, activeCoords: Coord[]) => {
  const composedBoard = board.map((line, lineIndex) => {
    return line.map((cell, cellIndex) => {
      const isActive = activeCoords.some(
        ([x, y]) => x === cellIndex && y === lineIndex
      );
      return isActive ? 1 : cell;
    });
  }) as GameBoard;

  return composedBoard;
};

const makePiece = (type: PieceType) => {
  const pieceMatrix = PIECE_ROTATIONS[type][0] as number[][];

  const [x, y] = getPieceStartCoord(pieceMatrix);

  return addPieceCoords({
    type,
    x,
    y,
    rotation: 0,
  });
};

const getPieceStartCoord = (pieceMatrix: number[][]): Coord => {
  const [firstLine] = pieceMatrix;

  const centerIndex = Math.floor(firstLine.length / 2);

  const x = 6 - centerIndex;
  const y = -pieceMatrix.length;

  return [x, y];
};

const addPieceCoords = (pieceBase: GamePieceBase): GamePiece => {
  const activeCoords = getActiveCoords(pieceBase);

  return {
    ...pieceBase,
    activeCoords,
  };
};

const getActiveCoords = (piece: GamePieceBase) => {
  const { x, y, rotation, type } = piece;
  const pieceMatrix = PIECE_ROTATIONS[type][rotation] as number[][];

  return pieceMatrix.reduce<Coord[]>(
    (acc, line, lineIndex) => [
      ...acc,
      ...line.reduce<Coord[]>((acc, cell, cellIndex) => {
        if (cell === 1) {
          return [...acc, [x + cellIndex, y + lineIndex]];
        }
        return acc;
      }, []),
    ],
    []
  );
};

export const checkCollision = (board: GameBoard, activeCoords: Coord[]) =>
  activeCoords.every(([x, y]) => y < 0 || board[y]?.[x] === 0);

const listenInput = () => {
  if (getKeyState("left")) {
    moveLaterally("left");
  }

  if (getKeyState("right")) {
    moveLaterally("right");
  }

  if (getKeyState("down")) {
    moveVertically();
  }

  if (getKeyState("up")) {
    rotate("right");
  }
};

const moveLaterally = (direction: "left" | "right") => {
  const { piece, staticBoard } = getGameState();

  if (!piece) return;

  const movedPiece = translatePiece(piece, direction);

  if (checkCollision(staticBoard, movedPiece.activeCoords)) {
    setGameState((draft) => {
      draft.lockDelay = true;
      draft.piece = movedPiece;
    });
  }
};

export const moveVertically = () => {
  const { piece, staticBoard, lockDelay } = getGameState();
  stopTimer(UPDATE_POS_TIMER);

  if (!piece) return;

  const movedPiece = translatePiece(piece, "down");

  if (checkCollision(staticBoard, movedPiece.activeCoords)) {
    return setGameState((draft) => {
      draft.piece = movedPiece;
      draft.lockDelay = false;
    });
  }

  if (!lockDelay) {
    return lockPiece();
  }

  if (!hasTimer("lock-piece")) setTimer("lock-piece", 30, lockPiece);
};

const rotate = (direction: "left" | "right") => {
  const { piece, staticBoard } = getGameState();

  if (!piece) return;

  const rotatedPiece = rotatePiece(piece, direction);

  if (checkCollision(staticBoard, rotatedPiece.activeCoords)) {
    setGameState((draft) => {
      draft.lockDelay = true;
      draft.piece = rotatedPiece;
    });
  }
};

export const lockPiece = () => {
  const { piece, staticBoard } = getGameState();

  if (!piece) return;

  setGameState((draft) => {
    draft.staticBoard = composeBoard(staticBoard, piece.activeCoords);
  });
  updateToNewPiece();
};

const translatePiece = (
  piece: GamePieceBase,
  direction: "left" | "right" | "down"
): GamePiece => {
  const translation = getTranslation(direction);

  const movePiece = addPieceCoords({
    ...piece,
    x: piece.x + translation.x,
    y: piece.y + translation.y,
  });

  return movePiece;
};

const rotatePiece = (piece: GamePieceBase, direction: "left" | "right") => {
  const { rotation } = piece;

  const newRotation = wrapRotaion(
    direction === "left" ? rotation - 1 : rotation + 1
  ) as Rotation;

  const rotatedPiece = addPieceCoords({
    ...piece,
    rotation: newRotation,
  });

  return rotatedPiece;
};

const getTranslation = (direction: "left" | "right" | "down"): XY => {
  switch (direction) {
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
    case "down":
      return { x: 0, y: 1 };
  }
};

const wrap = (min: number, max: number) => (value: number) => {
  const range = max - min + 1;
  return ((((value - min) % range) + range) % range) + min;
};

const wrapRotaion = wrap(0, 3);

export { game, setGameState, getGameState };
