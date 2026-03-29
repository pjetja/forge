import enCommon from './messages/en/common.json';
import enAuth from './messages/en/auth.json';
import enTrainer from './messages/en/trainer.json';
import enTrainee from './messages/en/trainee.json';

type Messages = typeof enCommon & typeof enAuth & typeof enTrainer & typeof enTrainee;

declare global {
  interface IntlMessages extends Messages {}
}
