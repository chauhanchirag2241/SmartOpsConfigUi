import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface School {
  id: string;
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  principalName: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolService {
  private mockSchools: School[] = [
    {
      id: '1',
      schoolName: 'Global International School',
      schoolCode: 'GIS001',
      email: 'admin@gis.edu',
      phone: '+1 234 567 8900',
      address: '123 Education Lane',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10001',
      principalName: 'John Doe',
      status: true
    },
    {
      id: '2',
      schoolName: 'Springfield High School',
      schoolCode: 'SHS002',
      email: 'contact@springfield.edu',
      phone: '+1 987 654 3210',
      address: '456 Learn Blvd',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      pincode: '62701',
      principalName: 'Jane Smith',
      status: false
    }
  ];

  getSchools(pageIndex = 1, pageSize = 10, searchQuery = '', sortColumn = '', sortDirection = '', filter = 'All'): Observable<{items: School[], totalCount: number}> {
    let items = [...this.mockSchools];
    
    if (searchQuery) {
      items = items.filter(s => s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) || s.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (filter === 'Active') {
      items = items.filter(s => s.status === true);
    } else if (filter === 'Inactive') {
      items = items.filter(s => s.status === false);
    }
    
    return of({ items, totalCount: items.length }).pipe(delay(500));
  }

  getSchoolById(id: string): Observable<School | undefined> {
    const school = this.mockSchools.find(s => s.id === id);
    return of(school).pipe(delay(500));
  }
}
