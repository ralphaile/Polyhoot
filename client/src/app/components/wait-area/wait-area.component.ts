import { Component, OnInit } from '@angular/core';
import { WaitAreaService } from '@app/services/wait-area-handler.service';
@Component({
    selector: 'app-wait-area',
    templateUrl: './wait-area.component.html',
    styleUrls: ['./wait-area.component.scss'],
})
export class WaitAreaComponent implements OnInit {
    isLeaving: boolean = false;

    constructor(private readonly waitAreaService: WaitAreaService) {}
    get waitAreaInformation() {
        return this.waitAreaService.waitAreaInfo;
    }

    get userType() {
        return this.waitAreaService.getUserType();
    }

    ngOnInit(): void {
        this.waitAreaService.initializePage();
    }

    connect() {
        const gameName: HTMLInputElement = document.getElementById('join-code') as HTMLInputElement;
        if (gameName) {
            this.waitAreaService.connect(gameName);
        }
    }

    banPlayerName(playerName: string): void {
        this.waitAreaService.banPlayerName(playerName);
    }

    startGame() {
        this.waitAreaService.startGame();
    }

    toggleLock() {
        this.waitAreaService.toggleLock();
    }

    getReasonStartGameIsDisabled(): string {
        return this.waitAreaService.getReasonStartGameIsDisabled();
    }

    isStartGameDisable(): boolean {
        return !this.waitAreaInformation.isLocked || !(this.waitAreaInformation.playersList.length || this.waitAreaInformation.isRandomMode);
    }
}
