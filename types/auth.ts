export interface LoginFormData {
    username: string;
    password: string;
  }
  
  export interface AuthResponse {
    user: {
      id: string;
      username: string;
      name: string;
      role: string;
    };
  }