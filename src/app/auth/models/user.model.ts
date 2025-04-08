export interface User {
    id?: number
    email: string
    name?: string
  }
  
  export interface AuthResponse {
    user: User
    access_token: string
  }
  
  export interface LoginCredentials {
    email: string
    password: string
  }
  
  export interface RegisterCredentials extends LoginCredentials {
    name: string
  }
  
  