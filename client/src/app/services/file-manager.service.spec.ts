// Needed for private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ErrorMessage } from '@common/errors';
import { QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { AlertService } from './alert.service';
import { FileManagerService } from './file-manager.service';

describe('FileManagerService', () => {
    let service: FileManagerService;
    let testQuiz: Quiz[];

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FileManagerService);
        testQuiz = [
            {
                id: '2',
                title: 'General Knowledge 2',
                description: 'A quiz to test your general knowledge',
                duration: 30,
                lastModification: new Date(),
                questions: [
                    {
                        type: QuestionType.MultipleChoices,
                        text: 'What is the capital of Canada?',
                        points: 10,
                        choices: [
                            { text: 'Toronto', isCorrect: false },
                            { text: 'Vancouver', isCorrect: false },
                            { text: 'Ottawa', isCorrect: true },
                            { text: 'Montreal', isCorrect: false },
                        ],
                    },
                    {
                        type: QuestionType.MultipleChoices,
                        text: 'The sun is a star.',
                        points: 10,
                        choices: [
                            { text: 'True', isCorrect: true },
                            { text: 'False', isCorrect: false },
                        ],
                    },
                ],
                isVisible: true,
            },
            {
                id: '1',
                title: 'General Knowledge 1',
                description: 'A quiz to test your general knowledge',
                duration: 30,
                lastModification: new Date(),
                questions: [
                    {
                        type: QuestionType.MultipleChoices,
                        text: 'What is the capital of Canada?',
                        points: 10,
                        choices: [
                            { text: 'Toronto', isCorrect: false },
                            { text: 'Vancouver', isCorrect: false },
                            { text: 'Ottawa', isCorrect: true },
                            { text: 'Montreal', isCorrect: false },
                        ],
                    },
                    {
                        type: QuestionType.MultipleChoices,
                        text: 'The sun is a star.',
                        points: 10,
                        choices: [
                            { text: 'True', isCorrect: true },
                            { text: 'False', isCorrect: false },
                        ],
                    },
                ],
                isVisible: true,
            },
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should export a quiz', () => {
        const spy = spyOn(service as any, 'stringifyQuiz');
        const spy2 = spyOn(service as any, 'getLink');
        service.exportQuiz({ title: 'test' } as Quiz);
        expect(spy).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it('should import a quiz', async () => {
        const mockFile = new File([JSON.stringify(testQuiz[0])], 'mock-quiz.json', {
            type: 'application/json',
        });

        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        const spy = spyOn(service as any, 'getQuiz');
        await service.importQuiz(mockEvent);
        expect(spy).toHaveBeenCalled();
    });

    it('should not import a quiz if no file is selected', async () => {
        const mockEvent = { target: { files: [] } } as unknown as Event;
        const spy = spyOn(service as any, 'getQuiz');
        await service.importQuiz(mockEvent);
        expect(spy).not.toHaveBeenCalled();
    });

    it('should stringify a quiz', () => {
        const spy = spyOn(JSON, 'stringify');
        service['stringifyQuiz'](testQuiz[0]);
        expect(spy).toHaveBeenCalled();
    });

    it('should create a link with the correct properties', () => {
        const quizJson =
            '{"title":"Test Quiz","lastModification":"2024-03-14T12:00:00.000Z","description":"Test Description","duration":60,"questions":[]}';
        const quizTitle = 'Test Quiz';
        const expectedHref = 'blob:http://localhost:9876';
        const expectedDownload = 'Test Quiz.json';

        const link = service['getLink'](quizJson, quizTitle);

        expect(link instanceof HTMLAnchorElement).toBe(true);
        expect(link.href).toContain(expectedHref);
        expect(link.download).toBe(expectedDownload);
    });

    it('should return a Quiz object when file is loaded successfully', async () => {
        const mockFile = new File([JSON.stringify(testQuiz[0])], 'mock-quiz.json', {
            type: 'application/json',
        });

        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;

        const quiz = await service.importQuiz(mockEvent);

        expect(quiz).toBeTruthy();
        expect(quiz?.title).toBe(testQuiz[0].title);
        expect(quiz?.description).toBe(testQuiz[0].description);
        expect(quiz?.isVisible).toBe(false);
    });

    it('should throw an error when file is not loaded successfully', async () => {
        const mockFile = new File([''], 'mock-quiz.json', {
            type: 'application/json',
        });

        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        const spy = spyOn(TestBed.inject(AlertService), 'showAlert');

        const quiz = await service.importQuiz(mockEvent);
        expect(quiz).toBeNull();
        expect(spy).toHaveBeenCalledWith(ErrorMessage.JSONError);
    });
});
