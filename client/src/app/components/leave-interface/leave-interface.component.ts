import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterService } from '@app/services/router.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { UserType } from '@common/user';

@Component({
    selector: 'app-leave-interface',
    templateUrl: './leave-interface.component.html',
    styleUrls: ['./leave-interface.component.scss'],
})
export class LeaveInterfaceComponent {
    @Output() isNotLeaving = new EventEmitter<string>();
    @Input() userType: UserType;
    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly routerService: RouterService,
        private readonly socketService: SocketClientService,
    ) {
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
    }

    leavePage(doesLeave: boolean) {
        if (doesLeave) {
            if (this.socketService.socket) this.socketService.disconnect();
            this.navigateToRightPage();
        }
        this.isNotLeaving.emit();
    }

    private navigateToRightPage() {
        if (this.userType === UserType.Player) {
            this.router.navigate(['/home']);
            return;
        }
        this.router.navigate(['/create-game'], { relativeTo: this.route });
    }
}
