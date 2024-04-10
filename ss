[1mdiff --git a/client/src/app/components/header/header.component.html b/client/src/app/components/header/header.component.html[m
[1mindex 4d47e5d..8884a9f 100644[m
[1m--- a/client/src/app/components/header/header.component.html[m
[1m+++ b/client/src/app/components/header/header.component.html[m
[36m@@ -1,7 +1,7 @@[m
 <header>[m
     <div class="container">[m
         <div class="logo-container">[m
[31m-            <div class="logo" onclick="window.location.href='/#/home'"></div>[m
[32m+[m[32m            <div class="logo" (click)="returnHomeProtocol()"></div>[m
         </div>[m
         <div #titleContainer class="title-container">[m
             <h1 class="title">Polyhoot</h1>[m
[1mdiff --git a/client/src/app/components/header/header.component.spec.ts b/client/src/app/components/header/header.component.spec.ts[m
[1mindex cd74cfa..af59f23 100644[m
[1m--- a/client/src/app/components/header/header.component.spec.ts[m
[1m+++ b/client/src/app/components/header/header.component.spec.ts[m
[36m@@ -1,5 +1,5 @@[m
 import { ComponentFixture, TestBed } from '@angular/core/testing';[m
[31m-import { HeaderComponent } from '@app/components/header/header.component';[m
[32m+[m[32mimport { DEFAULT_FONT_SIZE, HeaderComponent, STROKE_MODIFIER } from '@app/components/header/header.component';[m
 import { AppMaterialModule } from '../../modules/material.module';[m
 [m
 describe('HeaderComponent', () => {[m
[36m@@ -22,4 +22,27 @@[m [mdescribe('HeaderComponent', () => {[m
     it('should create', () => {[m
         expect(component).toBeTruthy();[m
     });[m
[32m+[m
[32m+[m[32m    it('should set the font size on init', () => {[m
[32m+[m[32m        component.ngOnInit();[m
[32m+[m[32m        expect(component.title.nativeElement.style.fontSize).toBe(DEFAULT_FONT_SIZE + 'rem');[m
[32m+[m[32m        expect(component.title.nativeElement.style.webkitTextStroke).toBe(DEFAULT_FONT_SIZE / STROKE_MODIFIER + 'rem rgb(110, 110, 110)');[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    it('returnHomeProtocol should change the href if shouldConfirmBeforeReturning is not initialize to true', () => {[m
[32m+[m[32m        const emitSpy = spyOn(component.confirmLeaving, 'emit');[m
[32m+[m[32m        const navigationSpy = spyOn(component.navigationService, 'navigateTo').and.stub();[m
[32m+[m
[32m+[m[32m        component.returnHomeProtocol();[m
[32m+[m
[32m+[m[32m        expect(navigationSpy).toHaveBeenCalledWith('/#/home');[m
[32m+[m[32m        expect(emitSpy).not.toHaveBeenCalled();[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    it('returnHomeProtocol should change the href if shouldConfirmBeforeReturning is not initialize to true', () => {[m
[32m+[m[32m        const spy = spyOn(component.confirmLeaving, 'emit');[m
[32m+[m[32m        component.shouldConfirmBeforeReturning = true;[m
[32m+[m[32m        component.returnHomeProtocol();[m
[32m+[m[32m        expect(spy).toHaveBeenCalled();[m
[32m+[m[32m    });[m
 });[m
[1mdiff --git a/client/src/app/components/header/header.component.ts b/client/src/app/components/header/header.component.ts[m
[1mindex 2c837ce..9df1a51 100644[m
[1m--- a/client/src/app/components/header/header.component.ts[m
[1m+++ b/client/src/app/components/header/header.component.ts[m
[36m@@ -1,6 +1,8 @@[m
[31m-import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';[m
[32m+[m[32mimport { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';[m
[32m+[m[32mimport { NavigationService } from '@app/services/navigation.service';[m
 [m
[31m-const strokeModifier = 10;[m
[32m+[m[32mexport const STROKE_MODIFIER = 10;[m
[32m+[m[32mexport const DEFAULT_FONT_SIZE = 1.8;[m
 [m
 @Component({[m
     selector: 'app-header',[m
[36m@@ -9,11 +11,23 @@[m [mconst strokeModifier = 10;[m
 })[m
 export class HeaderComponent implements OnInit {[m
     @ViewChild('titleContainer', { static: true }) title: ElementRef;[m
[31m-    @Input() headerHeight: number;[m
[32m+[m[32m    @Input() titleFontSize: number = DEFAULT_FONT_SIZE;[m
[32m+[m[32m    @Input() shouldConfirmBeforeReturning = false;[m
[32m+[m[32m    @Output() confirmLeaving = new EventEmitter();[m
[32m+[m
[32m+[m[32m    constructor(readonly navigationService: NavigationService) {}[m
 [m
     ngOnInit(): void {[m
         const title = this.title.nativeElement;[m
[31m-        title.style.fontSize = this.headerHeight + 'rem';[m
[31m-        title.style.webkitTextStroke = this.headerHeight / strokeModifier + 'rem #6e6e6e';[m
[32m+[m[32m        title.style.fontSize = this.titleFontSize + 'rem';[m
[32m+[m[32m        title.style.webkitTextStroke = this.titleFontSize / STROKE_MODIFIER + 'rem #6e6e6e';[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    returnHomeProtocol() {[m
[32m+[m[32m        if (this.shouldConfirmBeforeReturning) {[m
[32m+[m[32m            this.confirmLeaving.emit();[m
[32m+[m[32m            return;[m
[32m+[m[32m        }[m
[32m+[m[32m        this.navigationService.navigateTo('/#/home');[m
     }[m
 }[m
[1mdiff --git a/client/src/app/components/play-area/play-area.component.scss b/client/src/app/components/play-area/play-area.component.scss[m
[1mindex c7c7b98..d04cc05 100644[m
[1m--- a/client/src/app/components/play-area/play-area.component.scss[m
[1m+++ b/client/src/app/components/play-area/play-area.component.scss[m
[36m@@ -119,7 +119,7 @@[m
 [m
 .answers-container {[m
     width: 100%;[m
[31m-    height: 500px;[m
[32m+[m[32m    height: 300px;[m
 }[m
 .submit-area {[m
     width: 100%;[m
[1mdiff --git a/client/src/app/components/play-area/play-area.component.ts b/client/src/app/components/play-area/play-area.component.ts[m
[1mindex e498917..44ab3c6 100644[m
[1m--- a/client/src/app/components/play-area/play-area.component.ts[m
[1m+++ b/client/src/app/components/play-area/play-area.component.ts[m
[36m@@ -100,6 +100,7 @@[m [mexport class PlayAreaComponent implements OnInit {[m
     // This function change the state of the page to leaving[m
     // TODO : maybe remove the function if no more functionality are added[m
     leaveProtocol(): void {[m
[32m+[m[32m        window.console.log(this.isLeaving);[m
         this.isLeaving = true;[m
     }[m
 [m
[1mdiff --git a/client/src/app/pages/admin-page/admin-page.component.html b/client/src/app/pages/admin-page/admin-page.component.html[m
[1mindex c1bcea7..93c337d 100644[m
[1m--- a/client/src/app/pages/admin-page/admin-page.component.html[m
[1m+++ b/client/src/app/pages/admin-page/admin-page.component.html[m
[36m@@ -1,5 +1,5 @@[m
 <div class="header-container">[m
[31m-    <app-header [headerHeight]="1.8"></app-header>[m
[32m+[m[32m    <app-header [titleFontSize]="1.8"></app-header>[m
 </div>[m
 [m
 <div class="master-container justified">[m
[1mdiff --git a/client/src/app/pages/bank-page/bank-page.component.html b/client/src/app/pages/bank-page/bank-page.component.html[m
[1mindex 68cff5f..2e02b12 100644[m
[1m--- a/client/src/app/pages/bank-page/bank-page.component.html[m
[1m+++ b/client/src/app/pages/bank-page/bank-page.component.html[m
[36m@@ -1,4 +1,4 @@[m
[31m-<div class="header-container"><app-header [headerHeight]="0.7"></app-header></div>[m
[32m+[m[32m<div class="header-container"><app-header [titleFontSize]="0.7"></app-header></div>[m
 <section *ngIf="!showingForm">[m
     <app-question-list class="question-list" [inQuizPage]="false" (changeViewEvent)="changeView($event)"></app-question-list>[m
 </section>[m
[1mdiff --git a/client/src/app/pages/create-game-page/create-game-page.component.html b/client/src/app/pages/create-game-page/create-game-page.component.html[m
[1mindex 1702ef8..74f0162 100644[m
[1m--- a/client/src/app/pages/create-game-page/create-game-page.component.html[m
[1m+++ b/client/src/app/pages/create-game-page/create-game-page.component.html[m
[36m@@ -1,5 +1,5 @@[m
 <div class="header-container">[m
[31m-    <app-header [headerHeight]="0.7"></app-header>[m
[32m+[m[32m    <app-header [titleFontSize]="0.7"></app-header>[m
 </div>[m
 [m
 <div class="master-container">[m
[1mdiff --git a/client/src/app/pages/game-page/game-page.component.html b/client/src/app/pages/game-page/game-page.component.html[m
[1mindex c1ae1a5..0531b50 100644[m
[1m--- a/client/src/app/pages/game-page/game-page.component.html[m
[1m+++ b/client/src/app/pages/game-page/game-page.component.html[m
[36m@@ -1,10 +1,10 @@[m
[31m-<div>[m
[32m+[m[32m<div (mousemove)="trackSliding($event)" (mouseup)="endSliding()">[m
     <div class="header-container">[m
[31m-        <app-header [headerHeight]="0.7"></app-header>[m
[32m+[m[32m        <app-header [titleFontSize]="0.7" [shouldConfirmBeforeReturning]="true" (confirmLeaving)="wouldLeave()"></app-header>[m
     </div>[m
     <div class="play-area-and-sidebar-container" [ngStyle]="{ '--chat-wight': chatWidth + 'px' }">[m
         <app-sidebar id="sidebar"></app-sidebar>[m
[31m-        <div (mousedown)="slideProtocol()" class="master-resizer" (window:resize)="resizeProtocol()"></div>[m
[32m+[m[32m        <div (mousedown)="startSliding()" class="master-resizer" (window:resize)="resizeChat()"></div>[m
         <section class="play-area-container">[m
             <app-play-area class="play-area" tabindex="0"></app-play-area>[m
         </section>[m
[1mdiff --git a/client/src/app/pages/game-page/game-page.component.spec.ts b/client/src/app/pages/game-page/game-page.component.spec.ts[m
[1mindex 5bda26e..ccf432d 100644[m
[1m--- a/client/src/app/pages/game-page/game-page.component.spec.ts[m
[1m+++ b/client/src/app/pages/game-page/game-page.component.spec.ts[m
[36m@@ -3,7 +3,7 @@[m [mimport { HeaderComponent } from '@app/components/header/header.component';[m
 import { PlayAreaComponent } from '@app/components/play-area/play-area.component';[m
 import { SidebarComponent } from '@app/components/sidebar/sidebar.component';[m
 import { AppMaterialModule } from '../../modules/material.module';[m
[31m-import { GamePageComponent } from './game-page.component';[m
[32m+[m[32mimport { GamePageComponent, MAX_PERCENTAGE_OF_CHAT, MIN_NUM_OF_PX_OF_CHAT } from './game-page.component';[m
 [m
 describe('GamePageComponent', () => {[m
     let component: GamePageComponent;[m
[36m@@ -25,4 +25,57 @@[m [mdescribe('GamePageComponent', () => {[m
     it('should create', () => {[m
         expect(component).toBeTruthy();[m
     });[m
[32m+[m
[32m+[m[32m    it('the startSliding function should change isResizing to true', () => {[m
[32m+[m[32m        component.isResizing = false;[m
[32m+[m[32m        component.startSliding();[m
[32m+[m[32m        expect(component.isResizing).toBe(true);[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    it('the endSliding function should change isResizing to false', () => {[m
[32m+[m[32m        component.isResizing = true;[m
[32m+[m[32m        component.endSliding();[m
[32m+[m[32m        expect(component.isResizing).toBe(false);[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    it('the endSliding function should change isResizing to false', () => {[m
[32m+[m[32m        component.isResizing = true;[m
[32m+[m[32m        component.endSliding();[m
[32m+[m[32m        expect(component.isResizing).toBe(false);[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    it('the trackSliding function should change the chatWidth according to min and max', () => {[m
[32m+[m[32m        const RANDOM_CHAT_WIDTH = 200;[m
[32m+[m[32m        const RANDOM_WINDOW_SIZE = 1920;[m
[32m+[m[32m        window.innerWidth = RANDOM_WINDOW_SIZE;[m
[32m+[m
[32m+[m[32m        const mockMouseEventForNormalBehavior = new MouseEvent('mousemove', {[m
[32m+[m[32m            clientX: RANDOM_CHAT_WIDTH,[m
[32m+[m[32m        });[m
[32m+[m
[32m+[m[32m        component.startSliding();[m
[32m+[m[32m        component.trackSliding(mockMouseEventForNormalBehavior);[m
[32m+[m[32m        expect(component.chatWidth).toBe(RANDOM_CHAT_WIDTH);[m
[32m+[m
[32m+[m[32m        const mockMouseEventForMinBehavior = new MouseEvent('mousemove', {[m
[32m+[m[32m            clientX: 50,[m
[32m+[m[32m        });[m
[32m+[m
[32m+[m[32m        component.trackSliding(mockMouseEventForMinBehavior);[m
[32m+[m
[32m+[m[32m        expect(component.chatWidth).toBe(MIN_NUM_OF_PX_OF_CHAT);[m
[32m+[m
[32m+[m[32m        const mockMouseEventForMaxBehavior = new MouseEvent('mousemove', {[m
[32m+[m[32m            clientX: RANDOM_WINDOW_SIZE,[m
[32m+[m[32m        });[m
[32m+[m
[32m+[m[32m        component.trackSliding(mockMouseEventForMaxBehavior);[m
[32m+[m
[32m+[m[32m        expect(component.chatWidth).toBe(RANDOM_WINDOW_SIZE * MAX_PERCENTAGE_OF_CHAT);[m
[32m+[m[32m    });[m
[32m+[m
[32m+[m[32m    it('the endSliding function should change isResizing to false', () => {[m
[32m+[m[32m        component.wouldLeave();[m
[32m+[m[32m        expect(component.playAreaComponent.isLeaving).toBe(true);[m
[32m+[m[32m    });[m
 });[m
[1mdiff --git a/client/src/app/pages/game-page/game-page.component.ts b/client/src/app/pages/game-page/game-page.component.ts[m
[1mindex 23ee5da..a063510 100644[m
[1m--- a/client/src/app/pages/game-page/game-page.component.ts[m
[1m+++ b/client/src/app/pages/game-page/game-page.component.ts[m
[36m@@ -1,8 +1,9 @@[m
[31m-import { Component, OnInit } from '@angular/core';[m
[32m+[m[32mimport { Component, OnInit, ViewChild } from '@angular/core';[m
[32m+[m[32mimport { PlayAreaComponent } from '../../components/play-area/play-area.component';[m
 [m
 const DEFAULT_CHAT_WIGHT = 300;[m
[31m-const MAX_PERCENTAGE_OF_CHAT = 0.5;[m
[31m-const MIN_NUM_OF_PX_OF_CHAT = 150;[m
[32m+[m[32mexport const MAX_PERCENTAGE_OF_CHAT = 0.5;[m
[32m+[m[32mexport const MIN_NUM_OF_PX_OF_CHAT = 150;[m
 [m
 @Component({[m
     selector: 'app-game-page',[m
[36m@@ -10,26 +11,33 @@[m [mconst MIN_NUM_OF_PX_OF_CHAT = 150;[m
     styleUrls: ['./game-page.component.scss'],[m
 })[m
 export class GamePageComponent implements OnInit {[m
[32m+[m[32m    @ViewChild(PlayAreaComponent) playAreaComponent: PlayAreaComponent;[m
     chatWidth: number = DEFAULT_CHAT_WIGHT;[m
     isResizing: boolean = false;[m
 [m
     ngOnInit(): void {[m
[31m-        this.chatWidth = Math.min(Math.max(this.chatWidth, MIN_NUM_OF_PX_OF_CHAT), window.innerWidth * MAX_PERCENTAGE_OF_CHAT);[m
[32m+[m[32m        this.resizeChat();[m
     }[m
 [m
[31m-    resizeProtocol() {[m
[32m+[m[32m    resizeChat() {[m
         this.chatWidth = Math.min(Math.max(this.chatWidth, MIN_NUM_OF_PX_OF_CHAT), window.innerWidth * MAX_PERCENTAGE_OF_CHAT);[m
     }[m
 [m
[31m-    slideProtocol() {[m
[32m+[m[32m    startSliding() {[m
         this.isResizing = true;[m
[31m-        window.addEventListener('mousemove', (event: MouseEvent) => {[m
[31m-            if (this.isResizing) {[m
[31m-                this.chatWidth = Math.min(Math.max(event.clientX, MIN_NUM_OF_PX_OF_CHAT), window.innerWidth * MAX_PERCENTAGE_OF_CHAT);[m
[31m-            }[m
[31m-        });[m
[31m-        window.addEventListener('mouseup', () => {[m
[31m-            this.isResizing = false;[m
[31m-        });[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    trackSliding(event: MouseEvent) {[m
[32m+[m[32m        if (this.isResizing) {[m
[32m+[m[32m            this.chatWidth = Math.min(Math.max(event.clientX, MIN_NUM_OF_PX_OF_CHAT), window.innerWidth * MAX_PERCENTAGE_OF_CHAT);[m
[32m+[m[32m        }[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    endSliding() {[m
[32m+[m[32m        this.isResizing = false;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    wouldLeave() {[m
[32m+[m[32m        this.playAreaComponent.isLeaving = true;[m
     }[m
 }[m
[1mdiff --git a/client/src/app/pages/main-page/main-page.component.html b/client/src/app/pages/main-page/main-page.component.html[m
[1mindex 1fd62c9..67d8dc8 100644[m
[1m--- a/client/src/app/pages/main-page/main-page.component.html[m
[1m+++ b/client/src/app/pages/main-page/main-page.component.html[m
[36m@@ -1,5 +1,5 @@[m
 <div class="header-container">[m
[31m-    <app-header [headerHeight]="1.8"></app-header>[m
[32m+[m[32m    <app-header [titleFontSize]="1.8"></app-header>[m
 </div>[m
 <div class="master-container justified">[m
     <!-- <div></div> -->[m
[1mdiff --git a/client/src/app/pages/manage-games-page/manage-games-page.component.html b/client/src/app/pages/manage-games-page/manage-games-page.component.html[m
[1mindex cfa94b0..a801a2d 100644[m
[1m--- a/client/src/app/pages/manage-games-page/manage-games-page.component.html[m
[1m+++ b/client/src/app/pages/manage-games-page/manage-games-page.component.html[m
[36m@@ -1,4 +1,4 @@[m
[31m-<div class="header-container"><app-header [headerHeight]="0.7"></app-header></div>[m
[32m+[m[32m<div class="header-container"><app-header [titleFontSize]="0.7"></app-header></div>[m
 <div class="master-container">[m
     <!-- <div> -->[m
     <input type="file" class="file-input" (change)="importQuiz($event)" #fileUpload />[m
[1mdiff --git a/client/src/app/pages/manage-games-page/manage-games-page.component.spec.ts b/client/src/app/pages/manage-games-page/manage-games-page.component.spec.ts[m
[1mindex b592631..a665d6c 100644[m
[1m--- a/client/src/app/pages/manage-games-page/manage-games-page.component.spec.ts[m
[1m+++ b/client/src/app/pages/manage-games-page/manage-games-page.component.spec.ts[m
[36m@@ -1,3 +1,4 @@[m
[32m+[m[32mimport { HttpClientModule } from '@angular/common/http';[m
 import { ComponentFixture, TestBed } from '@angular/core/testing';[m
 import { HeaderComponent } from '@app/components/header/header.component';[m
 import { AppMaterialModule } from '../../modules/material.module';[m
[36m@@ -10,7 +11,7 @@[m [mdescribe('ManageGamesPageComponent', () => {[m
     beforeEach(async () => {[m
         await TestBed.configureTestingModule({[m
             declarations: [ManageGamesPageComponent, HeaderComponent],[m
[31m-            imports: [HttpClientTestingModule, AppMaterialModule],[m
[32m+[m[32m            imports: [HttpClientModule, AppMaterialModule],[m
         }).compileComponents();[m
     });[m
 [m
[1mdiff --git a/client/src/app/pages/wait-game-page/wait-game-page.component.html b/client/src/app/pages/wait-game-page/wait-game-page.component.html[m
[1mindex 2dc257b..c4266d0 100644[m
[1m--- a/client/src/app/pages/wait-game-page/wait-game-page.component.html[m
[1m+++ b/client/src/app/pages/wait-game-page/wait-game-page.component.html[m
[36m@@ -1,4 +1,4 @@[m
[31m-<div class="header-container"><app-header [headerHeight]="0.7"></app-header></div>[m
[32m+[m[32m<div class="header-container"><app-header [titleFontSize]="0.7"></app-header></div>[m
 [m
 <div class="master-container">[m
     <h2 class="waiting-text">Temp: Waiting Room</h2>[m
[1mdiff --git a/client/src/app/services/navigation.service.spec.ts b/client/src/app/services/navigation.service.spec.ts[m
[1mindex 057d521..d431b1a 100644[m
[1m--- a/client/src/app/services/navigation.service.spec.ts[m
[1m+++ b/client/src/app/services/navigation.service.spec.ts[m
[36m@@ -16,11 +16,4 @@[m [mdescribe('NavigationService', () => {[m
     it('should be created', () => {[m
         expect(service).toBeTruthy();[m
     });[m
[31m-[m
[31m-    // it('should navigate to the specified URL', fakeAsync(() => {[m
[31m-    //     const url = 'home';[m
[31m-    //     service.navigateTo(url);[m
[31m-    //     tick();[m
[31m-    //     expect(location.path()).toBe(url);[m
[31m-    // }));[m
 });[m
