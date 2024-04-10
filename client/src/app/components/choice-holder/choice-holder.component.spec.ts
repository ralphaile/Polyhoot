import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChoiceHolderComponent } from '@app/components/choice-holder/choice-holder.component';
import { SocketClientService } from '@app/services/socket-client.service';

class MockSocketClientService {
    send = jasmine.createSpy('send');
    on = jasmine.createSpy('on').and.callFake((event, callback) => {
        if (event === 'showAnswersForQuestion') {
            callback({ isCorrectAnswers: [true, false], playerAnswers: [true, false] });
        }
    });
}

describe('ChoiceHolderComponent', () => {
    let component: ChoiceHolderComponent;
    let fixture: ComponentFixture<ChoiceHolderComponent>;
    let mockSocketClientService: MockSocketClientService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChoiceHolderComponent],
            imports: [FormsModule],
            providers: [{ provide: SocketClientService, useClass: MockSocketClientService }],
        }).compileComponents();

        mockSocketClientService = TestBed.inject(SocketClientService) as unknown as MockSocketClientService;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChoiceHolderComponent);
        component = fixture.componentInstance;
        component.choices = ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not select a choice when a key outside 1-4 is pressed', () => {
        spyOn(component, 'selectChoice');
        const event = new KeyboardEvent('keydown', { key: '5' });
        window.dispatchEvent(event);
        expect(component.selectChoice).not.toHaveBeenCalled();
    });

    it('should call selectChoice with correct index when key 1 is pressed', () => {
        spyOn(component, 'selectChoice');
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        expect(component.selectChoice).toHaveBeenCalledWith(0);
    });

    it('should not call selectChoice when input or textarea is focused', () => {
        spyOn(component, 'selectChoice');
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();

        const event = new KeyboardEvent('keydown', { key: '2' });
        window.dispatchEvent(event);
        expect(component.selectChoice).not.toHaveBeenCalled();

        document.body.removeChild(input);
    });

    it('resetChoices() should reset isCurrentAnswers to false for all choices', () => {
        component.isCurrentAnswers = [true, true, false, false];
        component.resetChoices();
        expect(component.isCurrentAnswers).toEqual([false, false, false, false]);
    });

    it('resetChoices() should maintain the same length as choices', () => {
        component.resetChoices();
        expect(component.isCurrentAnswers.length).toEqual(component.choices.length);
    });

    it('ngOnInit() should initialize sockets and set choices based on current question', () => {
        spyOn(component as never, 'initializeSocket').and.callThrough();
        mockSocketClientService.send.and.callFake((event, callback) => {
            if (event === 'getCurrentQuestion') {
                callback({ choicesText: ['A', 'B', 'C', 'D'] });
            }
        });
        component.ngOnInit();
        expect(component['initializeSocket']).toHaveBeenCalled();
        expect(component.choices).toEqual(['A', 'B', 'C', 'D']);
        expect(component.isCurrentAnswers).toEqual([false, false, false, false]);
    });

    it('should call resetChoices() to reset isCurrentAnswers when receiving new question', () => {
        spyOn(component, 'resetChoices').and.callThrough();
        mockSocketClientService.send.calls.reset();
        mockSocketClientService.send.and.callFake((event, callback) => {
            if (event === 'getCurrentQuestion') {
                callback({ choicesText: ['E', 'F', 'G', 'H'] });
            }
        });

        component.ngOnInit();

        expect(component.resetChoices).toHaveBeenCalled();
        expect(component.choices).toEqual(['E', 'F', 'G', 'H']);
        expect(component.isCurrentAnswers).toEqual([false, false, false, false]);
    });

    describe('selectChoice', () => {
        beforeEach(() => {
            component.isEnabled = true;
            component.choices = ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'];
            component.isCurrentAnswers = [false, false, false, false];
        });

        it('should update isCurrentAnswers when a choice is selected and is not disabled', () => {
            const choiceIndex = 1;
            mockSocketClientService.send.and.callFake((event, index, callback) => {
                if (event === 'toggleChoice' && index === choiceIndex + 1) {
                    callback(true);
                }
            });

            component.selectChoice(choiceIndex);
            expect(component.isCurrentAnswers[choiceIndex]).toBeTrue();
        });

        it('should not update isCurrentAnswers when component is disabled', () => {
            component.isEnabled = false;
            const choiceIndex = 2;

            component.selectChoice(choiceIndex);
            expect(component.isCurrentAnswers[choiceIndex]).toBeFalse();
        });

        it('should call socketService.send with correct parameters when a choice is selected', () => {
            const choiceIndex = 0;
            component.selectChoice(choiceIndex);
            expect(mockSocketClientService.send).toHaveBeenCalledWith('toggleChoice', choiceIndex + 1, jasmine.any(Function));
        });
    });

    it('should reset isCurrentAnswers when loadNextQuestion event is received', () => {
        component.isCurrentAnswers = [true, true, false, false];
        mockSocketClientService.on.and.callFake((event, callback) => {
            if (event === 'loadNextQuestion') {
                callback();
            }
        });

        component.ngOnInit();
        expect(component.isCurrentAnswers).toEqual([false, false, false, false]);
    });
});
