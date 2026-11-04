import { gameFrame } from './story-helpers';

export default {
  title: 'Tic Tac Toe/New Game',
  tags: ['autodocs'],
  render: (args) => gameFrame({ ...args, mode: 'menu' }),
  args: { playerMark: 'X' },
  argTypes: { playerMark: { control: 'inline-radio', options: ['X', 'O'] } },
};

export const PickX = {};
export const PickO = { args: { playerMark: 'O' } };
