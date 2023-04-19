export type GameBoard = number[][];

export const CLEAN_BOARD: GameBoard = Array.from({ length: 20 }, () =>
  Array.from({ length: 10 }, () => 0)
);
