export interface ILoginRequest {
  UserName: string;
  PassWord: string;
  RememberMe: boolean;
}

export interface ILoginResponse {
  Status: boolean;
  Token: string;
  Error: string;
}

export interface IAuthConfig {
  username: string;
  password: string;
}
