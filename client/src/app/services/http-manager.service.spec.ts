import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Question, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { from } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpManager } from './http-manager.service';

describe('httpManager', () => {
    let httpMock: HttpTestingController;
    let service: HttpManager;
    let baseUrl: string;
    const testQuiz: Quiz[] = [
        {
            id: '1',
            title: 'JavaScript Basics',
            description: 'A quiz about the basics of JavaScript.',
            duration: 30,
            lastModification: new Date(),
            questions: [],
            isVisible: true,
        },
    ];
    const testQuestions: Question[] = [
        {
            id: '0',
            type: QuestionType.MultipleChoices,
            text: 'Question Test',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        },
        {
            id: '1',
            type: QuestionType.MultipleChoices,
            text: 'Question Test2',
            points: 20,
            choices: [
                { text: 'c', isCorrect: true },
                { text: 'd', isCorrect: false },
            ],
        },
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(HttpManager);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = environment.serverUrl;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call the right http request once when fetching all questions', async () => {
        from(service.fetchAllQuestions()).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions`);
        expect(req.request.method).toBe('GET');

        req.flush(testQuestions);
    });

    it('should return an empty array if there is an error fetching all questions', async () => {
        from(service.fetchAllQuestions()).subscribe((questions) => {
            expect(questions).toEqual([]);
        });

        const req = httpMock.expectOne(`${baseUrl}/questions`);
        expect(req.request.method).toBe('GET');

        req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should call the right http request once when fetching all multiple questions', async () => {
        from(service.fetchAllMultipleQuestions()).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions`);
        expect(req.request.method).toBe('GET');

        req.flush(testQuestions);
    });

    it('should return [] if there is an error fetching all the multiple questions', async () => {
        spyOn(service, 'fetchAllQuestions').and.throwError('Error');
        const questions = await service.fetchAllMultipleQuestions();
        expect(questions).toEqual([]);
    });

    it('should return an empty array if there is an error fetching all multiple questions', async () => {
        from(service.fetchAllMultipleQuestions()).subscribe((questions) => {
            expect(questions).toEqual([]);
        });

        const req = httpMock.expectOne(`${baseUrl}/questions`);
        expect(req.request.method).toBe('GET');

        req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should call the right http request once when fetching one questions', async () => {
        from(service.fetchQuestion(testQuestions[1].text)).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions/${testQuestions[1].text}`);
        expect(req.request.method).toBe('GET');

        req.flush(testQuestions[1]);
    });

    it('should call the right http request once when adding one questions', async () => {
        from(service.addQuestion(testQuestions[1])).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions`);
        expect(req.request.method).toBe('POST');
    });

    it('should call the right http request once when modifying one questions', async () => {
        from(service.modifyQuestion(testQuestions[1])).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions`);
        expect(req.request.method).toBe('PATCH');
    });

    it('should call the right http request once when deleting one questions', async () => {
        from(service.deleteQuestion('1')).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions/${testQuestions[1].id}`);
        expect(req.request.method).toBe('DELETE');
    });

    it('should validate player answers correctly', async () => {
        const questionId = '1';
        const playerAnswers = [true, false];
        const expectedResponse = { isValid: true };

        from(service.validatePlayerAnswers(questionId, playerAnswers)).subscribe((isValid) => {
            expect(isValid).toEqual(expectedResponse.isValid);
        });

        const req = httpMock.expectOne(`${baseUrl}/questions/validate-answers`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ questionId, playerAnswers });
        req.flush(expectedResponse);
    });

    it('should handle error during player answers validation', async () => {
        const questionId = '1';
        const playerAnswers = [true, false];

        from(service.validatePlayerAnswers(questionId, playerAnswers)).subscribe({
            error: (error) => {
                expect(error).toBeTruthy();
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/questions/validate-answers`);
        expect(req.request.method).toBe('POST');
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should fetch correct answers for a question', async () => {
        const questionId = '1';
        const expectedCorrectAnswers = [true, false];

        from(service.getCorrectAnswers(questionId)).subscribe((correctAnswers) => {
            expect(correctAnswers).toEqual(expectedCorrectAnswers);
        });

        const req = httpMock.expectOne(`${baseUrl}/questions/correct-answers`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ questionId });
        req.flush({ correctAnswers: expectedCorrectAnswers });
    });

    it('should handle error during fetching correct answers', async () => {
        const questionId = '1';

        from(service.getCorrectAnswers(questionId)).subscribe({
            error: (error) => {
                expect(error).toBeTruthy();
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/questions/correct-answers`);
        expect(req.request.method).toBe('POST');
        req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should call the right http request once when validating a question', async () => {
        from(service.validateQuestion(testQuestions[0])).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/questions/validate`);
        expect(req.request.method).toBe('POST');
    });

    it('should call the right http request once when fetching all quizzes', async () => {
        from(service.fetchAllQuizzes()).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/manage-games`);
        expect(req.request.method).toBe('GET');

        req.flush(testQuiz);
    });

    it('should return an empty array if there is an error fetching all quizzes', async () => {
        from(service.fetchAllQuizzes()).subscribe((quizzes) => {
            expect(quizzes).toEqual([]);
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/manage-games`);
        expect(req.request.method).toBe('GET');

        req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should call the right http request once when fetching a quiz', async () => {
        from(service.fetchQuiz(testQuiz[0].title)).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/manage-games/${testQuiz[0].title}`);
        expect(req.request.method).toBe('GET');

        req.flush(testQuiz[0]);
    });
    it('should call the right http request once when adding one quiz', async () => {
        from(service.addQuiz(testQuiz[0])).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/manage-games`);
        expect(req.request.method).toBe('POST');
    });

    it('should call the right http request once when modifying one quiz', async () => {
        from(service.modifyQuiz(testQuiz[0])).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/manage-games`);
        expect(req.request.method).toBe('PATCH');
    });

    it('should call the right http request once when deleting one quiz', async () => {
        from(service.deleteQuiz(testQuiz[0].id)).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/manage-games/${testQuiz[0].id}`);
        expect(req.request.method).toBe('DELETE');
    });

    it('should call the right http request once when authorizing access', async () => {
        from(service.authorize('password')).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/login`);
        expect(req.request.method).toBe('POST');
    });

    it('should call the right http request when fetching history', async () => {
        from(service.fetchHistory()).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/history`);
        expect(req.request.method).toBe('GET');
    });

    it('should call the right http request when deleting history', async () => {
        from(service.deleteHistory()).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/admin/history`);
        expect(req.request.method).toBe('DELETE');
    });

    it('should return an empty array if there is an error fetching history', async () => {
        from(service.fetchHistory()).subscribe((history) => {
            expect(history).toEqual([]);
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/history`);
        expect(req.request.method).toBe('GET');

        req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
});
