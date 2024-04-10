import { TestBed } from '@angular/core/testing';

import { GameHistory } from '@common/game';
import { HistorySorterService } from './history-sorter.service';

describe('HistorySorterService', () => {
    let service: HistorySorterService;
    let history: GameHistory[];

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(HistorySorterService);
        history = [
            {
                name: 'Ancient Empires',
                startTime: new Date('2023-05-15T13:30:00'),
                players: 4,
                bestScore: 9500,
            },
            {
                name: 'Medieval Quest',
                startTime: new Date('2022-10-08T10:15:00'),
                players: 2,
                bestScore: 7800,
            },
            {
                name: 'Space Odyssey',
                startTime: new Date('2024-01-20T16:45:00'),
                players: 3,
                bestScore: 11200,
            },
            {
                name: 'Future Wars',
                startTime: new Date('2023-11-30T19:00:00'),
                players: 6,
                bestScore: 14500,
            },
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should sort history by date in ascending order', () => {
        const sortedHistory = service.sortHistory(history, true, 'date');
        expect(sortedHistory[0].name).toBe('Medieval Quest');
        expect(sortedHistory[1].name).toBe('Ancient Empires');
        expect(sortedHistory[2].name).toBe('Future Wars');
        expect(sortedHistory[3].name).toBe('Space Odyssey');
    });

    it('should sort history by date in descending order', () => {
        const sortedHistory = service.sortHistory(history, false, 'date');
        expect(sortedHistory[0].name).toBe('Space Odyssey');
        expect(sortedHistory[1].name).toBe('Future Wars');
        expect(sortedHistory[2].name).toBe('Ancient Empires');
        expect(sortedHistory[3].name).toBe('Medieval Quest');
    });

    it('should sort history by name in ascending order', () => {
        const sortedHistory = service.sortHistory(history, true, 'name');
        expect(sortedHistory[0].name).toBe('Space Odyssey');
        expect(sortedHistory[1].name).toBe('Medieval Quest');
        expect(sortedHistory[2].name).toBe('Future Wars');
        expect(sortedHistory[3].name).toBe('Ancient Empires');
    });

    it('should sort history by name in descending order', () => {
        const sortedHistory = service.sortHistory(history, false, 'name');
        expect(sortedHistory[0].name).toBe('Ancient Empires');
        expect(sortedHistory[1].name).toBe('Future Wars');
        expect(sortedHistory[2].name).toBe('Medieval Quest');
        expect(sortedHistory[3].name).toBe('Space Odyssey');
    });
});
