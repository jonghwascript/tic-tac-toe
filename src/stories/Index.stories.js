import { gameFrame } from './story-helpers';

export default {
  title: 'Tic Tac Toe/Full Page',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: (args) => gameFrame({ ...args, fullPage: true, height: 900 }),
  args: { mode: 'menu', playerMark: 'X' },
  argTypes: {
    mode: { control: 'inline-radio', options: ['menu', 'player', 'cpu'] },
    playerMark: { control: 'inline-radio', options: ['X', 'O'] },
  },
};

export const NewGame = {};
export const TwoPlayers = { args: { mode: 'player' } };
export const Cpu = { args: { mode: 'cpu' } };
