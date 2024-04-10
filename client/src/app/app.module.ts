import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChoiceHolderComponent } from '@app/components/choice-holder/choice-holder.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { PinCodeComponent } from '@app/components/pin-code/pin-code.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { QrlAnswerHolderComponent } from '@app/components/qrl-answer-holder/qrl-answer-holder.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { WaitAreaComponent } from '@app/components/wait-area/wait-area.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { BankPageComponent } from '@app/pages/bank-page/bank-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ManageGamesPageComponent } from '@app/pages/manage-games-page/manage-games-page.component';
import { WaitGamePageComponent } from '@app/pages/wait-game-page/wait-game-page.component';
import { LoginComponent } from './components/Login/login.component';
import { AlertComponent } from './components/alert/alert.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { CreateQuestionComponent } from './components/create-question/create-question.component';
import { CreateQuizComponent } from './components/create-quiz/create-quiz.component';
import { EvaluationComponent } from './components/evaluation/evalutation.component';
import { HistoryComponent } from './components/history/history.component';
import { LeaveInterfaceComponent } from './components/leave-interface/leave-interface.component';
import { NameComponent } from './components/name/name.component';
import { OrganizerViewComponent } from './components/organizer-view/organizer-view.component';
import { PlayerScoreListComponent } from './components/player-score-list/player-score-list.component';
import { QuestionListComponent } from './components/question-list/question-list.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { ResultHistogramComponent } from './components/result-histogram/result-histogram.component';
import { TimerComponent } from './components/timer/timer.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { HistoryPageComponent } from './pages/history-page/history-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        LoginComponent,
        CreateGamePageComponent,
        WaitAreaComponent,
        WaitGamePageComponent,
        AlertComponent,
        LeaveInterfaceComponent,
        PinCodeComponent,
        NameComponent,
        JoinPageComponent,
        AppComponent,
        TimerComponent,
        ResultHistogramComponent,
        ChoiceHolderComponent,
        QrlAnswerHolderComponent,
        AdminPageComponent,
        GamePageComponent,
        MainPageComponent,
        ManageGamesPageComponent,
        BankPageComponent,
        PlayAreaComponent,
        SidebarComponent,
        TimerComponent,
        PlayerScoreListComponent,
        ChoiceHolderComponent,
        QrlAnswerHolderComponent,
        HeaderComponent,
        QuestionListComponent,
        CreateQuestionComponent,
        CreateQuizComponent,
        QuizListComponent,
        OrganizerViewComponent,
        PinCodeComponent,
        JoinPageComponent,
        HistoryPageComponent,
        HistoryComponent,
        EvaluationComponent,
        ConfirmationDialogComponent,
    ],
    imports: [
        MatSelectModule,
        DragDropModule,
        FormsModule,
        ReactiveFormsModule,
        AppMaterialModule,
        MatDialogModule,
        MatButtonModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatListModule,
        MatButtonModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatListModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        MatRadioModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
