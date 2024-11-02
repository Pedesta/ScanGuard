export interface Visitor {
  _id: string;
  identification: string;
  firstname: string;
  surname: string;
  birthDate: string;
  age?: number;
  gender?: string;
  checkin: Date;
  checkout: Date;
  stay: number;
  image?: string; // Base64 string
  ocrSuccess: boolean;
  ocrMessage: string;
  purpose: string;
  whereFrom?: string;
  whereTo?: string;
  createdAt: Date;
  updatedAt: Date;
}
  
  export interface AnalyticsData {
    name: string;
    visitors: number;
  }

  export interface User {
    _id?: string;
    username: string;
    password: string;
    name: string;
    role: 'admin' | 'user' | "superuser";
    createdAt: Date;
  }
  
  export interface VisitorOCRData {
    identification: string;
    firstname: string;
    surname: string;
    birthDate: string;
    gender?: string;
  }
  
  export interface GPTVisionResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
    error?: {
      message: string;
    };
  }