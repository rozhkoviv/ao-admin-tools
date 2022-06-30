import { ProgressBar } from './progressbar.interface';
import { ProgressSpinner } from './progressspinner.interface';

export interface Progress {
  progressBar?: ProgressBar;
  spinner?: ProgressSpinner;
}
