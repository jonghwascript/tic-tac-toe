import { dialogFrame } from './story-helpers';

export default {
  title: 'Tic Tac Toe/Dialog',
  tags: ['autodocs'],
  render: (args) => dialogFrame(args),
  args: { result: 'O', playerMark: 'X', mode: 'cpu', restart: false },
  argTypes: {
    result: { control: 'inline-radio', options: ['X', 'O', 'ties'] },
    playerMark: { control: 'inline-radio', options: ['X', 'O'] },
    mode: { control: 'inline-radio', options: ['cpu', 'player'] },
    restart: { control: 'boolean' },
  },
};

export const XWins = { args: { result: 'X' } };
export const OWins = {};
export const PlayerOneWins = { args: { result: 'X', mode: 'player' } };
export const Tied = { args: { result: 'ties' } };
export const Restart = { args: { restart: true } };
