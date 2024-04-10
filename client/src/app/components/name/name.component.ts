import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertService } from '@app/services/alert.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ErrorMessage } from '@common/errors';
import { SocketEvents } from '@common/socketEvents';

@Component({
    selector: 'app-name',
    templateUrl: './name.component.html',
    styleUrls: ['./name.component.scss'],
})
export class NameComponent implements OnInit, OnDestroy {
    @Input() gameCode: number;
    @Output() playerConnected = new EventEmitter<string>();
    nameForm: FormGroup;
    private isLoggedIn: boolean;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly alertService: AlertService,
        private readonly socketService: SocketClientService,
    ) {
        this.isLoggedIn = false;
        this.nameForm = this.formBuilder.group({
            playerName: '',
        });
    }

    ngOnInit(): void {
        this.initializeAction();
    }

    ngOnDestroy(): void {
        if (!this.isLoggedIn) {
            this.socketService.disconnect();
        }
    }

    nameSubmitted(): void {
        const name = this.nameForm.value.playerName.trim();

        if (!this.isNameValid(name)) {
            return;
        }

        this.socketService.send(SocketEvents.PlayerLogin, [this.gameCode, name]);
    }

    private isNameValid(name: string): boolean {
        return !this.isNameEmpty(name) && !this.isNameOrganizor(name) && !this.isNameSystem(name);
    }

    private initializeAction(): void {
        this.socketService.socket.on(SocketEvents.LoginError, (message: string) => {
            this.alertService.showAlert(message);
        });

        this.socketService.socket.on(SocketEvents.LoginSuccessful, () => {
            this.isLoggedIn = true;
            this.playerConnected.emit(this.nameForm.value.playerName.trim());
        });
    }

    private isNameEmpty(name: string): boolean {
        if (name.length === 0) {
            this.alertService.showAlert(ErrorMessage.EmptyName);
            return true;
        }
        return false;
    }

    private isNameOrganizor(name: string): boolean {
        if (name.toLowerCase() === 'organisateur') {
            this.alertService.showAlert(ErrorMessage.OrganizorName);
            return true;
        }
        return false;
    }
    private isNameSystem(name: string): boolean {
        if (name.toLowerCase() === 'system') {
            this.alertService.showAlert(ErrorMessage.SystemName);
            return true;
        }
        return false;
    }
}
