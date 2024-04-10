import { TestBed } from '@angular/core/testing';
import { Question, QuestionType } from '@common/question';
import { HandleQuestionListsService } from './handle-question-lists.service';

describe('HandleQuestionListsService', () => {
    let service: HandleQuestionListsService;
    let testQuestions: Question[];

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HandleQuestionListsService);
        testQuestions = [
            {
                id: '0',
                type: QuestionType.MultipleChoices,
                text: 'Question Test',
                lastModification: 'Mon Jan 29 2024 12:24:41 GMT-0500 (Eastern Standard Time)',
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
                lastModification: 'Mon Jan 29 2024 12:11:13 GMT-0500 (Eastern Standard Time)',
                points: 20,
                choices: [
                    { text: 'c', isCorrect: true },
                    { text: 'd', isCorrect: false },
                ],
            },
            {
                id: '2',
                type: QuestionType.LongAnswer,
                text: 'Question Test2',
                lastModification: 'Mon Jan 29 2024 12:11:15 GMT-0500 (Eastern Standard Time)',
                points: 20,
                choices: [],
            },
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true if question is in question list', () => {
        expect(service.isQuestionInQuestionList(testQuestions[0], testQuestions)).toBeTrue();
    });

    it('should return false if question is not in question list', () => {
        const question = { text: 'test' } as Question;
        expect(service.isQuestionInQuestionList(question, testQuestions)).toBeFalse();
    });

    it('should return all questions if type is all', () => {
        expect(service.filterQuestionsByType(testQuestions, QuestionType.All)).toEqual(testQuestions);
    });

    it('should return filtered questions by type', () => {
        const expected = [testQuestions[0], testQuestions[1]];
        expect(service.filterQuestionsByType(testQuestions, QuestionType.MultipleChoices)).toEqual(expected);
    });

    it('should return sorted questions by last modification', () => {
        const expected = [testQuestions[1], testQuestions[2], testQuestions[0]];
        expect(service.getSortedQuestions(testQuestions)).toEqual(expected);
    });

    it('should throw error if last modification is not defined', () => {
        testQuestions[0].lastModification = undefined;
        expect(() => service.getSortedQuestions(testQuestions)).toThrowError();
    });
});
