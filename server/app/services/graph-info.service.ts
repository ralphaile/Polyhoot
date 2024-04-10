import { GameInfo } from '@common/game';
import { EvaluatedLongResponse } from '@common/longResponse';
import { Choice, GraphInfo, Question } from '@common/question';
import { Service } from 'typedi';
import { GameInformationService } from './game-info.service';

@Service()
export class GraphInfoService {
    constructor(private readonly gameInfoService: GameInformationService) {}

    getInitialLongAnswerDisplay(game: GameInfo): GraphInfo[] {
        return [
            {
                text: 'Nombre de joueurs ayant modifié leur réponse dans les 5 dernières secondes',
                nbOfSelection: game.nbOfRecentModification,
            },
            {
                text: "Nombre de joueurs n'ayant pas modifié leur réponse dans les 5 dernières secondes",
                nbOfSelection: this.gameInfoService.getNumberOfOnlinePlayers(game) - game.nbOfRecentModification,
            },
        ];
    }

    generateLongResponseQuestionForHistogram(question: Question): void {
        question.choices = [
            {
                text: '0%',
                isCorrect: true,
                nbOfSelection: 0,
            },
            {
                text: '50%',
                isCorrect: true,
                nbOfSelection: 0,
            },
            {
                text: '100%',
                isCorrect: true,
                nbOfSelection: 0,
            },
        ];
    }

    modifyChoicesForHistogram(question: Question, evaluatedResponse: EvaluatedLongResponse): void {
        switch (evaluatedResponse.multiplier) {
            case 0: {
                question.choices[0].nbOfSelection++;
                break;
            }
            case 1 / 2: {
                question.choices[1].nbOfSelection++;
                break;
            }
            case 1: {
                question.choices[2].nbOfSelection++;
                break;
            }
        }
    }

    getMultipleChoiceGraphInfo(choices: Choice[]): GraphInfo[] {
        const graphInfos: GraphInfo[] = [];
        choices.forEach((choice: Choice) => {
            const graphInfo: GraphInfo = {
                text: choice.text,
                nbOfSelection: choice.nbOfSelection,
                isCorrect: choice.isCorrect,
            };
            graphInfos.push(graphInfo);
        });
        return graphInfos;
    }
}
