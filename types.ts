
export enum QuestionType {
  WH_QUESTION = 'WH_QUESTION',
  YES_NO = 'YES_NO',
  STATEMENT = 'STATEMENT',
  CHOICE = 'CHOICE',
  TAG = 'TAG'
}

export interface TOEICQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: 'A' | 'B' | 'C';
  explanation: string;
  vietnameseTranslation: {
    prompt: string;
    optionA: string;
    optionB: string;
    optionC: string;
    explanation: string;
  };
}

export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  answers: Record<number, 'A' | 'B' | 'C' | null>;
  isFinished: boolean;
  questions: TOEICQuestion[];
}
