import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ILoginRequest,
  ILoginResponse,
  IAuthConfig,
} from '../interfaces/auth.interface';
import { ZENAI_CONSTANTS } from '../constants/zenai.constant';
import * as FormData from 'form-data';

@Injectable()
export class ZenAIAuthService {
  private readonly logger = new Logger(ZenAIAuthService.name);
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private readonly authConfig: IAuthConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = ZENAI_CONSTANTS.DEFAULT_API_URL;

    // Lấy thông tin đăng nhập từ env
    const username = this.configService.get<string>('ZENAI_USERNAME');
    const password = this.configService.get<string>('ZENAI_PASSWORD');

    if (!username || !password) {
      throw new Error(ZENAI_CONSTANTS.ERROR_MESSAGES.AUTH.MISSING_CREDENTIALS);
    }

    this.authConfig = {
      username,
      password,
    };
  }

  /**
   * Lấy access token hiện tại hoặc login để lấy token mới
   */
  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.login();
    }
    return this.accessToken;
  }

  /**
   * Thực hiện login để lấy access token mới
   * @throws {Error} Khi đăng nhập thất bại
   */
  async login(): Promise<void> {
    try {
      // Reset token cũ trước khi login mới
      this.resetToken();

      const formData = new FormData();
      formData.append('UserName', this.authConfig.username);
      formData.append('PassWord', this.authConfig.password);
      formData.append('RememberMe', 'true');

      const { data } = await firstValueFrom(
        this.httpService.post<ILoginResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.AUTH.LOGIN}`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Accept: 'application/json, text/plain, */*',
            },
          },
        ),
      );

      if (!data.Status || !data.Token) {
        throw new Error(
          data.Error || ZENAI_CONSTANTS.ERROR_MESSAGES.AUTH.LOGIN_FAILED,
        );
      }

      this.accessToken = data.Token;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.Error || error?.message || 'Lỗi không xác định';
      this.logger.error('Lỗi khi đăng nhập:', errorMessage);
      throw new Error('Không thể đăng nhập: ' + errorMessage);
    }
  }

  /**
   * Reset token hiện tại, buộc phải login lại
   */
  resetToken(): void {
    this.accessToken = null;
  }
}
