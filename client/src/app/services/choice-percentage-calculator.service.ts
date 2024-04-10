import { Injectable } from '@angular/core';
import { MIN_MODIFIER } from '@common/const';
import { QuestionForResultDisplay } from '@common/question';

@Injectable({
    providedIn: 'root',
})
export class ChoicePercentageCalculatorService {
    calculatePercentage(currentDisplayedQuestion: QuestionForResultDisplay): number[] {
        const currentNumberOfVotes = this.getNumberOfVotes(currentDisplayedQuestion);

        const barsLength: number[] = [0, 0, 0, 0];
        for (let i = 0; i < currentDisplayedQuestion.bandInfo.length; i++) {
            barsLength[i] = this.getPercentageOfResponse(i, currentNumberOfVotes, currentDisplayedQuestion);
        }
        return barsLength;
    }

    private getPercentageOfResponse(index: number, totalNumberOfVote: number, currentDisplayedQuestion: QuestionForResultDisplay): number {
        if (!currentDisplayedQuestion.bandInfo[index].nbOfSelection) {
            return MIN_MODIFIER;
        }
        // I can use this eslint because I already verify before if it is undefined or null
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return Math.max(currentDisplayedQuestion.bandInfo[index].nbOfSelection! / totalNumberOfVote, MIN_MODIFIER);
    }

    private getNumberOfVotes(currentDisplayedQuestion: QuestionForResultDisplay): number {
        let currentNumberOfVotes = 0;
        currentDisplayedQuestion.bandInfo.forEach((element) => {
            if (element.nbOfSelection) {
                currentNumberOfVotes += element.nbOfSelection;
            }
        });

        return Math.max(currentNumberOfVotes, 1);
    }
}
