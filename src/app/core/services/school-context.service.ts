import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

export interface SelectedSchool {
  id: string;
  name: string;
  subdomain: string;
}

const STORAGE_KEY = 'config_selected_school';

@Injectable({ providedIn: 'root' })
export class SchoolContextService {
  private readonly storage = inject(StorageService);
  private readonly selectedSubject = new BehaviorSubject<SelectedSchool | null>(
    this.storage.get<SelectedSchool>(STORAGE_KEY),
  );

  readonly selectedSchool$ = this.selectedSubject.asObservable();

  get selectedSchool(): SelectedSchool | null {
    return this.selectedSubject.value;
  }

  get hasSchool(): boolean {
    return !!this.selectedSubject.value?.subdomain;
  }

  selectSchool(school: SelectedSchool | null): void {
    if (school) {
      this.storage.set(STORAGE_KEY, school);
    } else {
      this.storage.remove(STORAGE_KEY);
    }
    this.selectedSubject.next(school);
  }

  clear(): void {
    this.selectSchool(null);
  }
}
