import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '@app/components/Login/login.component';
import { PinCodeComponent } from '@app/components/pin-code/pin-code.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { BankPageComponent } from '@app/pages/bank-page/bank-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HistoryPageComponent } from '@app/pages/history-page/history-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ManageGamesPageComponent } from '@app/pages/manage-games-page/manage-games-page.component';
import { WaitGamePageComponent } from '@app/pages/wait-game-page/wait-game-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'admin/manage-games', component: ManageGamesPageComponent },
    { path: 'admin/history', component: HistoryPageComponent },
    { path: 'create-game', component: CreateGamePageComponent },
    { path: 'join-page', component: JoinPageComponent },
    { path: 'pin-code', component: PinCodeComponent },
    { path: 'wait-game', component: WaitGamePageComponent },
    { path: 'admin/bank', component: BankPageComponent },
    { path: 'admin', component: AdminPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
