import { gameFrame } from './story-helpers';

export default {
  title: 'Tic Tac Toe/Game Board',
  tags: ['autodocs'],
  render: (args) => gameFrame(args),
  args: { mode: 'player', playerMark: 'X' },
  argTypes: {
    mode: { control: 'inline-radio', options: ['player', 'cpu'] },
    playerMark: { control: 'inline-radio', options: ['X', 'O'] },
  },
};

export const TwoPlayers = {};
export const Cpu = { args: { mode: 'cpu' } };
export const CpuStarts = { args: { mode: 'cpu', playerMark: 'O' } };
export const InProgress = {
  args: { board: ['O', null, 'X', null, null, null, null, null, null] },
  argTypes: { board: { control: false } },
};
