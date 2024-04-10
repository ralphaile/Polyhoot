import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrlAnswerHolderComponent } from '@app/components/qrl-answer-holder/qrl-answer-holder.component';
import { MAX_NUMBER_OF_CHAR_IN_QRL } from '@common/const';
import { AppMaterialModule } from '../../modules/material.module';

describe('QrlAnswerHolderComponent', () => {
    let component: QrlAnswerHolderComponent;
    let fixture: ComponentFixture<QrlAnswerHolderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QrlAnswerHolderComponent],
            imports: [AppMaterialModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QrlAnswerHolderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('function changeCharCount should recalculate the number of char', () => {
        const MY_PHRASE = 'Hello World!';
        const textArea = document.createElement('textarea');
        textArea.value = MY_PHRASE;

        component.changeCharCount(textArea);
        expect(component.numberOfChar).toBe(MY_PHRASE.length);
    });

    it('should not call changeCharCount when handleTab is called with something else than Tab', () => {
        const MY_PHRASE = 'Hello World!';
        const textArea = document.createElement('textarea');
        textArea.value = MY_PHRASE;
        const eventInit: KeyboardEventInit = {
            key: 'a',
        };
        const event = new KeyboardEvent('keydown', eventInit);
        const spy = spyOn(component, 'changeCharCount');

        component.handleTab(textArea, event);
        expect(spy).not.toHaveBeenCalled();
    });

    it('should not add a tabulation if the textarea has the maxNumberOfCharacter', () => {
        const MY_CHAR = 'A';
        const textArea = document.createElement('textarea');
        for (let i = 0; i < MAX_NUMBER_OF_CHAR_IN_QRL; i++) {
            textArea.value += MY_CHAR;
        }
        const eventInit: KeyboardEventInit = {
            key: 'Tab',
        };
        const event = new KeyboardEvent('keydown', eventInit);
        component.handleTab(textArea, event);
        expect(textArea.value).not.toContain('\t');
    });

    it('should add a tabulation if the textarea has not the maxNumberOfCharacter', () => {
        const MY_PHRASE = 'Hello World!';
        const textArea = document.createElement('textarea');
        textArea.value = MY_PHRASE;
        const eventInit: KeyboardEventInit = {
            key: 'Tab',
        };
        const event = new KeyboardEvent('keydown', eventInit);
        component.handleTab(textArea, event);
        expect(textArea.value).toContain('\t');
    });
});
