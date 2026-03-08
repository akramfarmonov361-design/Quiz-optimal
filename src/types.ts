export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  backgroundImage: string;
  audioBase64?: string;
}

export interface Quiz {
  title: string;
  questions: Question[];
}
