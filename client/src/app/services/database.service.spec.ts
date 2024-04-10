import { TestBed } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { DatabaseService } from './database.service';
import { HttpManager } from './http-manager.service';

describe('DatabaseService', () => {
    let service: DatabaseService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [HttpManager],
        }).compileComponents();
    });

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DatabaseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call httpManager.modifyQuestion when updateQuestions is called with isModifyingQuestion true', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'modifyQuestion');
        await service.updateQuestions(true, null, { text: 'test' } as Question);
        expect(spy).toHaveBeenCalled();
    });

    it('should call httpManager.addQuestion when updateQuestions is called with isModifyingQuestion false', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'addQuestion');
        await service.updateQuestions(false, null, { text: 'test' } as Question);
        expect(spy).toHaveBeenCalled();
    });

    it('should call httpManager.modifyQuiz when updateQuiz is called with isModifyingQuiz true', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'modifyQuiz');
        await service.updateQuiz(true, { title: 'test' } as Quiz);
        expect(spy).toHaveBeenCalled();
    });

    it('should call httpManager.addQuiz when updateQuiz is called with isModifyingQuiz false', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'addQuiz');
        await service.updateQuiz(false, { title: 'test' } as Quiz);
        expect(spy).toHaveBeenCalled();
    });

    it('should call httpManager.fetchAllQuestions when fetchQuestions is called', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'fetchAllQuestions');
        await service.fetchQuestions();
        expect(spy).toHaveBeenCalled();
    });

    it('should call httpManager.fetchAllQuizzes when fetchQuizzes is called', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'fetchAllQuizzes');
        await service.fetchQuizzes();
        expect(spy).toHaveBeenCalled();
    });

    it('should call httpManager.deleteQuestion when deleteQuestion is called', async () => {
        const questions: Question[] = [{ id: '0', text: 'test' } as Question];
        const spy = spyOn(TestBed.inject(HttpManager), 'deleteQuestion').and.resolveTo();
        const newQuestions = await service.deleteQuestion(questions[0], questions);
        expect(spy).toHaveBeenCalled();
        expect(newQuestions).toEqual([]);
    });

    it('should call httpManager.deleteQuiz when deleteQuiz is called', async () => {
        const quizzes: Quiz[] = [{ id: '0', title: 'test' } as Quiz];
        const spy = spyOn(TestBed.inject(HttpManager), 'deleteQuiz').and.resolveTo();
        const newQuizzes = await service.deleteQuiz(quizzes[0], quizzes);
        expect(spy).toHaveBeenCalled();
        expect(newQuizzes).toEqual([]);
    });

    it('should get the history', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'fetchHistory');
        await service.getHistory();
        expect(spy).toHaveBeenCalled();
    });

    it('should delete the history', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'deleteHistory');
        await service.deleteHistory();
        expect(spy).toHaveBeenCalled();
    });
});
