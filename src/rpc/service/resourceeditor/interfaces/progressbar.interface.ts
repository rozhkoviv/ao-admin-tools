import { ProgressAction } from './progressaction.enum';

export interface ProgressBar {
  action: ProgressAction;
  max?: number;
  current?: number;
}
