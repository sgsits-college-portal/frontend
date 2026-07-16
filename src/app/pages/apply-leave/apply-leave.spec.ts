import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-apply-leave',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './apply-leave.html',
  styleUrl: './apply-leave.css'
})
export class ApplyLeave {

  leaveType = '';
  startDate = '';
  endDate = '';
  reason = '';

  applyLeave() {

    console.log({
      leaveType: this.leaveType,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason
    });

    alert("Leave Applied Successfully");

  }

}