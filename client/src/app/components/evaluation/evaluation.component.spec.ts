import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketEvents } from '@common/socketEvents';
import { EvaluationComponent } from './evalutation.component';

describe('EvaluationComponent', () => {
    let component: EvaluationComponent;
    let fixture: ComponentFixture<EvaluationComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketClientService>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('SocketClientService', ['send']);

        await TestBed.configureTestingModule({
            declarations: [EvaluationComponent],
            providers: [{ provide: SocketClientService, useValue: spy }],
        }).compileComponents();

        socketServiceSpy = TestBed.inject(SocketClientService) as jasmine.SpyObj<SocketClientService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EvaluationComponent);
        component = fixture.componentInstance;
        component.responsesArray = [
            { userName: 'Charlie', longResponse: 'Response C' },
            { userName: 'Alice', longResponse: 'Response A' },
            { userName: 'Bob', longResponse: 'Response B' },
        ];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should sort responses by user names on initialization', () => {
        component.ngOnInit();
        expect(component.responsesArray[0].userName).toEqual('Alice');
        expect(component.responsesArray[1].userName).toEqual('Bob');
        expect(component.responsesArray[2].userName).toEqual('Charlie');
    });

    it('should evaluate response and go to the next one', () => {
        component.responsesArray = [
            { userName: 'User1', longResponse: 'Response 1' },
            { userName: 'User2', longResponse: 'Response 2' },
        ];
        fixture.detectChanges();
        component.evaluateResponse(2);
        expect(component.currentIndex).toEqual(1);
        expect(component.evaluatedResponses.length).toEqual(1);
        expect(component.evaluatedResponses[0]).toEqual({ userName: 'User1', multiplier: 2 });
    });

    it('should emit event and send evaluated responses when last response is evaluated', () => {
        spyOn(component.allResponsesEvaluated, 'emit');
        component.responsesArray = [{ userName: 'User1', longResponse: 'Response 1' }];
        fixture.detectChanges();
        component.evaluateResponse(2);
        expect(component.allResponsesEvaluated.emit).toHaveBeenCalledWith(true);
        expect(socketServiceSpy.send.calls.count()).toEqual(1);
        expect(socketServiceSpy.send.calls.mostRecent().args[0]).toBe(SocketEvents.EvaluationLongResponse);
        expect(socketServiceSpy.send.calls.mostRecent().args[1]).toEqual([{ userName: 'User1', multiplier: 2 }]);
    });
});
