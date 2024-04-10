import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_FONT_SIZE, STROKE_MODIFIER } from '@common/const';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
    @ViewChild('titleContainer', { static: true }) title: ElementRef;
    @Input() fontSize: number = DEFAULT_FONT_SIZE;
    hasHomePathProhibited: boolean;

    constructor(private readonly router: Router) {
        this.hasHomePathProhibited = false;
    }

    ngOnInit(): void {
        this.setHeaderFont();
        this.subscribeToRouterEvents();
    }

    navigateToHome(): void {
        if (!this.hasHomePathProhibited) {
            this.router.navigate(['/home']);
        }
    }

    private setHeaderFont(): void {
        const title = this.title.nativeElement;
        title.style.fontSize = this.fontSize + 'rem';
        title.style.webkitTextStroke = this.fontSize / STROKE_MODIFIER + 'rem #6e6e6e';
    }

    private subscribeToRouterEvents(): void {
        this.router.events.subscribe(() => {
            if (this.router.url === '/game' || this.router.url === '/wait-game') {
                this.hasHomePathProhibited = true;
            } else {
                this.hasHomePathProhibited = false;
            }
        });
    }
}
