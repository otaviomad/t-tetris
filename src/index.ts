import { render } from "./render/render";
import { input } from "./input";
import { game } from "./game";
import { timers } from "./timer";

const TICK_RATE = 1000 / 60;

const main = () => {
  game.mount();
  input.mount();
  timers.mount();
  render.mount();

  const mainLoop = () => {
    setTimeout(mainLoop, TICK_RATE);

    game.tick();
    render.tick();
    timers.tick();
    input.tick();
  };

  mainLoop();
};

main();
