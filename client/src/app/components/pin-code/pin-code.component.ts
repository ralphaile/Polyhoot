import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertService } from '@app/services/alert.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { CODE_LENGTH } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { SocketEvents } from '@common/socketEvents';

@Component({
    selector: 'app-pin-code',
    templateUrl: './pin-code.component.html',
    styleUrls: ['./pin-code.component.scss'],
})
export class PinCodeComponent {
    @Output() codeSubmitted = new EventEmitter<number>();
    pinCodeForm: FormGroup;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly alertService: AlertService,
        private readonly socketService: SocketClientService,
    ) {
        this.pinCodeForm = this.formBuilder.group({
            accessCode: '',
        });
    }

    async submitCode(): Promise<void> {
        const code: string = this.pinCodeForm.value.accessCode;
        if (await this.isValidCode(code)) {
            this.codeSubmitted.emit(parseInt(code, 10));
        }
    }

    private async connect(code: number): Promise<boolean> {
        try {
            if (!this.socketService.isSocketAlive()) {
                this.socketService.connect();
                return await this.isRoomValid(code);
            }
            return false;
        } catch (error) {
            this.alertService.showAlert(ErrorMessage.ConnexionError);
            return false;
        }
    }

    private async isValidCode(code: string): Promise<boolean> {
        if (!this.isCodeCorrectLength(code) || !this.isCodeDigits(code)) {
            return false;
        }
        return await this.connect(parseInt(code, 10));
    }

    private isCodeCorrectLength(code: string): boolean {
        if (code.length !== CODE_LENGTH) {
            this.alertService.showAlert(ErrorMessage.CodeIsNotFourDigits);
            return false;
        }
        return true;
    }

    private isCodeDigits(code: string): boolean {
        for (const char of code) {
            if (isNaN(parseInt(char, 10))) {
                this.alertService.showAlert(ErrorMessage.CodeIsNotFourDigits);
                return false;
            }
        }
        return true;
    }

    private async isRoomValid(code: number): Promise<boolean> {
        return new Promise((resolve) => {
            this.socketService.send(SocketEvents.ValidateCode, code, (res: { isValid: boolean; isLocked: boolean }) => {
                if (res.isLocked || !res.isValid) {
                    this.alertService.showAlert(res.isLocked ? ErrorMessage.LockedGame : ErrorMessage.InvalidCode);
                    this.socketService.disconnect();
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
}
