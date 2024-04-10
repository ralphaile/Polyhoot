import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ErrorMessage } from '@common/errors';
import { Question, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { AlertService } from './alert.service';
import { GameQuestionValidatorService } from './game-question-validator.service';
import { HttpManager } from './http-manager.service';

describe('GameQuestionValidatorService', () => {
    let service: GameQuestionValidatorService;
    let question: Question;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientModule],
        }).compileComponents();
    });
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameQuestionValidatorService);
        question = {
            id: '0',
            text: 'test',
            type: QuestionType.MultipleChoices,
            points: 10,
            choices: [
                { text: 'test', isCorrect: true },
                { text: 'test', isCorrect: false },
            ],
        };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true for valid question', async () => {
        spyOn(TestBed.inject(HttpManager), 'validateQuestion').and.returnValue(Promise.resolve(new HttpResponse<string>()));
        expect(await service['isQuestionValid'](question)).toBeTrue();
    });

    it('should return false for invalid question and show alert', async () => {
        spyOn(TestBed.inject(HttpManager), 'validateQuestion').and.returnValue(Promise.reject({ error: 'Erreur X' }));

        const spy = spyOn(TestBed.inject(AlertService), 'showAlert');
        expect(await service['isQuestionValid'](question)).toBeFalse();
        expect(spy).toHaveBeenCalledWith('Erreur X');
    });

    it('should return true if question is in quiz', () => {
        expect(service['isInQuiz'](question, { questions: [{ text: question.text, id: '1' } as Question] } as Quiz)).toBeTrue();
    });

    it('should return false if question is not in quiz', () => {
        expect(service['isInQuiz'](question, { questions: [{ text: 'not' } as Question] } as Quiz)).toBeFalse();
    });

    it('should validate question', async () => {
        // Needed due to private method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(service as any, 'isQuestionValid').and.returnValue(Promise.resolve(true));
        spyOn(service, 'isInQuiz').and.returnValue(false);

        expect(await service.isValidQuestion(question, {} as Quiz)).toBeTrue();
    });

    it('should not validate question if it is in quiz and show alert', async () => {
        spyOn(service, 'isInQuiz').and.returnValue(true);
        const spy = spyOn(TestBed.inject(AlertService), 'showAlert');
        expect(await service.isValidQuestion(question, {} as Quiz)).toBeFalse();
        expect(spy).toHaveBeenCalledWith(ErrorMessage.SimilarQuestionInQuiz);
    });
});
