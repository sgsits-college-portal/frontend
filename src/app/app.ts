import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { inject } from '@angular/core';
import { Navbar } from './shared/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sgsits-portal');

  router = inject(Router);
}
