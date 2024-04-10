import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '@app/services/alert.service';
import { DatabaseService } from '@app/services/database.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { RANDOM_MODE_ALLOWED } from '@common/const';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    quizzes: Quiz[];
    selectedGame: Quiz | null = null;
    randomQuiz: Quiz;
    questions: Question[];

    // This component needs 4 services to work properly
    // eslint-disable-next-line max-params
    constructor(
        private databaseService: DatabaseService,
        private readonly router: Router,
        public socketService: SocketClientService,
        private readonly alertService: AlertService,
    ) {}

    async ngOnInit() {
        await this.initializeGamePage();
    }

    visibleGames(): Quiz[] {
        return this.quizzes ? this.quizzes.filter((game) => game.isVisible) : [];
    }

    async selectGame(quiz: Quiz) {
        this.quizzes = await this.databaseService.fetchQuizzes();
        if (this.randomQuiz) this.quizzes.unshift(this.randomQuiz);

        const refreshedQuiz = this.quizzes.find((q) => q.id === quiz.id);
        if (await this.validateQuizVisibility(quiz, refreshedQuiz)) {
            this.setSelectedGame(refreshedQuiz);
        }
    }

    navigateToGame(): void {
        if (this.selectedGame?.title === 'Mode aléatoire') this.connect('randomGame');
        else this.connect('organizer');
        this.router.navigate(['/wait-game']);
    }

    navigateToTest(): void {
        this.connect('tester');
        this.router.navigate(['/game']);
    }

    private async initializeGamePage() {
        this.questions = await this.databaseService.fetchMultipleQuestions();
        this.setRandomGame();
        const allQuizzes: Quiz[] = await this.databaseService.fetchQuizzes();
        this.quizzes = this.quizzes.concat(allQuizzes);
    }

    private setRandomGame(): void {
        if (this.questions.length >= RANDOM_MODE_ALLOWED) {
            this.quizzes = [];
            this.randomQuiz = this.createRandomGame();
            this.quizzes.push(this.randomQuiz);
        } else return;
    }

    private createRandomGame(): Quiz {
        const randomQuestions: Question[] = this.selectRandomQuestions();
        const randomQuiz: Quiz = {
            id: Date.now().toString(),
            title: 'Mode aléatoire',
            description: 'Cinq questions aléatoires',
            duration: 20,
            lastModification: new Date(),
            questions: randomQuestions,
            isVisible: true,
        };
        return randomQuiz;
    }

    private selectRandomQuestions(): Question[] {
        const selectedQuestions: Question[] = [];
        for (let i = 0; i < RANDOM_MODE_ALLOWED; i++) {
            const randomIndex = Math.floor(Math.random() * this.questions.length);
            selectedQuestions.push(this.questions[randomIndex]);
            this.questions.splice(randomIndex, 1);
        }
        return selectedQuestions;
    }

    private setSelectedGame(refreshedQuiz: Quiz | undefined): void {
        if (refreshedQuiz && refreshedQuiz !== this.selectedGame) this.selectedGame = refreshedQuiz;
        else this.selectedGame = null;
    }

    private async validateQuizVisibility(selectedQUiz: Quiz, refreshedQuiz: Quiz | undefined): Promise<boolean> {
        if (!refreshedQuiz || !refreshedQuiz.isVisible) {
            this.selectedGame = null;
            this.alertService.showAlert(`Le quiz ${selectedQUiz.title} ne peut pas être sélectionné. Veuillez en choisir un autre.`);
            await this.initializeGamePage();
            return false;
        }
        return true;
    }
    private connect(userType: string) {
        if (this.socketService.socket) {
            this.socketService.disconnect();
        }
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
            this.socketService.send(userType + 'Login', this.selectedGame);
        }
    }
}
