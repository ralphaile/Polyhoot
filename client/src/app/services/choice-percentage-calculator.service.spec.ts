import { TestBed } from '@angular/core/testing';

import { MIN_MODIFIER } from '@common/const';
import { QuestionForResultDisplay, QuestionType } from '@common/question';
import { ChoicePercentageCalculatorService } from './choice-percentage-calculator.service';

describe('ChoicePercentageCalculatorService', () => {
    let service: ChoicePercentageCalculatorService;
    let currentDisplayedQuestion: QuestionForResultDisplay;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ChoicePercentageCalculatorService);
        currentDisplayedQuestion = {
            text: 'Test Question',
            points: 1,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [
                { text: 'Choice 1', isCorrect: true, nbOfSelection: 5 },
                { text: 'Choice 2', isCorrect: false, nbOfSelection: 0 },
            ],
        };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('return the number of votes', () => {
        const expectedNumberOfVotes = 5;
        expect(service['getNumberOfVotes'](currentDisplayedQuestion)).toEqual(expectedNumberOfVotes);
    });

    it('return the percentage of response', () => {
        const expectedPercentage = 1;
        const totalNumberOfVote = 5;
        expect(service['getPercentageOfResponse'](0, totalNumberOfVote, currentDisplayedQuestion)).toEqual(expectedPercentage);
    });

    it('return the percentage of response with a minimum value', () => {
        const totalNumberOfVote = 5;
        expect(service['getPercentageOfResponse'](1, totalNumberOfVote, currentDisplayedQuestion)).toEqual(MIN_MODIFIER);
    });

    it('calculate the percentage of each choice', () => {
        const expectedPercentage = [1, MIN_MODIFIER, 0, 0];
        expect(service.calculatePercentage(currentDisplayedQuestion)).toEqual(expectedPercentage);
    });
});
