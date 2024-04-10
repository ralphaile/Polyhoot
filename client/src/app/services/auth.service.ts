import { Injectable } from '@angular/core';
import { ErrorMessage } from '@common/errors';
import { AlertService } from './alert.service';
import { HttpManager } from './http-manager.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private isLoggedIn: boolean;
    constructor(
        private readonly httpManager: HttpManager,
        private readonly alertService: AlertService,
    ) {
        this.isLoggedIn = false;
    }

    getIsLoggedIn() {
        return this.isLoggedIn;
    }

    async verifyPassword(password: string) {
        try {
            this.isLoggedIn = (await this.httpManager.authorize(password)) as boolean;
        } catch (error) {
            this.alertService.showAlert(ErrorMessage.ConnexionError);
        }
    }
}
