import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
    providedIn: 'root',
})
export class ConfirmationDialogService {
    constructor(private dialog: MatDialog) {}

    // It is the type of a dialog box from angular material
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openConfirmationDialog(text: string): MatDialogRef<ConfirmationDialogComponent, any> {
        return this.dialog.open(ConfirmationDialogComponent, {
            width: '700px',
            data: { text },
        });
    }
}
