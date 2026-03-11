import { Component, OnInit } from '@angular/core';
import { ZaduzenjaService } from '../../services/zaduzenja-service/zaduzenja.service';
import { User } from '../../models/user';
import { Predmet } from '../../models/predmet';
import { Odeljenje } from '../../models/odeljenje';
import { Zaduzenje } from '../../models/zaduzenje';
import { SkolaDTO } from '../../models/DTOs/skolaDTO';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service/user.service';

@Component({
  selector: 'app-moja-zaduzenja',
  templateUrl: './moja-zaduzenja.component.html',
  styleUrl: './moja-zaduzenja.component.css'
})
export class MojaZaduzenjaComponent implements OnInit {
  zaduzenja: Zaduzenje[] = [];
  profesori: User[] = [];
  predmeti: Predmet[] = [];
  odeljenja: Odeljenje[] = [];
  skole: SkolaDTO[] = [];
  filteredPredmeti: any[] = [];
  filteredOdeljenja: Odeljenje[] = [];
  selectedOdeljenje: Odeljenje | null = null;
  selectedUcenici: User[] = [];

  //PRIKAZ
  filteredZaduzenja: any[] = [];
  // Filter promenljive
  filterProfesor: string | null = null;
  filterPredmet: string | null = null;
  filterOdeljenje: string | null = null;
  filterRazred: string | null = null;
  filterSkola: string | null = null;
  razredi: number[] = []; // Liste razreda koji su dostupni
  selectedSkola = false;

  profPredmeti: Predmet[] = [];
  profOdeljenja: Odeljenje[] = [];
  profSkole: SkolaDTO[] = [];

  noviZahtev = {
  idProfesora: 0,
  idPredmeta: '',
  idOdeljenja: '',
  idSkole: 0
  };
  mojiZahtevi: any[] = [];
  zahteviOdeljenja: Odeljenje[] = [];
  zahteviPredmeti: Predmet[] = [];
  selectedSkolaZahtev = false;

  constructor(private userService: UserService, private zaduzenjaService: ZaduzenjaService, private router: Router) { 

    this.filterProfesor = this.userService.getCurrentUserId();
  }

  ngOnInit(): void {
    this.loadZaduzenja();
    this.noviZahtev.idProfesora = Number(this.filterProfesor);
    this.loadMojiZahtevi();
  }

  loadZaduzenja() {
    this.zaduzenjaService.getPredmeti().subscribe(data => {
      this.predmeti = data;

      this.zaduzenjaService.getOdeljenja().subscribe(data => {
        this.odeljenja = data;
        
        this.zaduzenjaService.getSkole().subscribe(
          (response: any) => {
            this.skole = response;
            this.zaduzenjaService.getZaduzenjaByProfesorId(this.filterProfesor).subscribe(data => {
            data.forEach(zaduzenje => {
              zaduzenje.odeljenje = this.odeljenja.find(x => x.id === zaduzenje.idOdeljenja);
              zaduzenje.predmet = this.predmeti.find(x => x.id === zaduzenje.idPredmeta);
              zaduzenje.profesor = this.profesori.find(x => x.id === zaduzenje.idProfesora);

              if(this.profPredmeti.findIndex(x => x.id == zaduzenje.predmet?.id) == -1 && zaduzenje.predmet)
              {
                this.profPredmeti.push(zaduzenje.predmet);
              }
              if(zaduzenje.odeljenje)
              {
                if(this.profOdeljenja.findIndex(x => x.id == zaduzenje.odeljenje?.id) == -1)
                  {
                    this.profOdeljenja.push(zaduzenje.odeljenje);

                    if(this.razredi.findIndex( x => x == zaduzenje.odeljenje?.razred) == -1)
                    {
                      this.razredi.push(zaduzenje.odeljenje.razred);
                    }
                  }

                if(this.skole.findIndex(x => x.id == zaduzenje.odeljenje?.idSkole) != -1)
                {
                  var fSkola = this.skole.find(x => x.id == zaduzenje.odeljenje?.idSkole);
                  if(fSkola)
                  {
                    zaduzenje.odeljenje.skola = fSkola;
                    if(this.profSkole.findIndex(x => x.id == fSkola?.id) == -1)
                    {
                      this.profSkole.push(fSkola);
                    }
                  }
                }      
              }
          });
          this.zaduzenja = data;
          this.applyFilter();
        });
      });    
    }); 
  }
);  
  }

  deleteZaduzenje(id: number) {
    this.zaduzenjaService.deleteZaduzenje(id).subscribe(() => {
      this.loadZaduzenja();
      this.router.navigate(['/zaduzenja']);
    });
  }

  filterOdeljenja(idSkole: any){
    this.filteredOdeljenja = this.profOdeljenja.filter(x => x.idSkole == idSkole);
    this.selectedSkola = true;
    this.applyFilter();
  }

  applyFilter() {
    this.filteredZaduzenja = this.zaduzenja.filter(zaduzenje =>
      (!this.filterSkola || this.odeljenja.find(odeljenje => odeljenje.id === zaduzenje.idOdeljenja)?.skola.id.toString() == this.filterSkola) &&
      (!this.filterPredmet || zaduzenje.idPredmeta.toString() == this.filterPredmet) &&
      (!this.filterOdeljenje || this.odeljenja.find(odeljenje => odeljenje.id === zaduzenje.idOdeljenja)?.id.toString() == this.filterOdeljenje) &&
      (!this.filterRazred || this.odeljenja.find(odeljenje => odeljenje.id === zaduzenje.idOdeljenja)?.razred.toString() == this.filterRazred)
    );
  }

  getPredmetiByRazred(razred: string) {
    return this.profPredmeti.filter(predmet => predmet.razred.toString() === razred);
  }

  showOdeljenje(odeljenje: any){
    this.userService.getUceniciByOdeljenjeId(odeljenje.id).subscribe((res: User[])=>{
      this.selectedUcenici = res;
      this.selectedOdeljenje = odeljenje;
    })
  }

  closeModal() {
    this.selectedOdeljenje = null; // Resetuje selektovano odeljenje na null da sakrije modal
    this.selectedUcenici = []; // Resetuje listu učenika
  }
  loadMojiZahtevi() {
  this.zaduzenjaService.getZahteviByProfesorId(Number(this.filterProfesor)).subscribe(zahtevi => {
    this.mojiZahtevi = zahtevi.map(z => ({
      ...z,
      predmet: this.predmeti.find(p => p.id == z.idPredmeta),
      odeljenje: this.odeljenja.find(o => o.id == z.idOdeljenja),
      skola: this.skole.find(s => s.id == z.idSkole)
    }));
  });
}

filterOdeljenjaZahtev(idSkole: number) {
  this.zahteviOdeljenja = this.odeljenja.filter(x => x.idSkole == idSkole);
  this.zahteviPredmeti = [];
  this.noviZahtev.idOdeljenja = '';
  this.noviZahtev.idPredmeta = '';
  this.selectedSkolaZahtev = true;
}

filterPredmeteZahtev(idOdeljenja: string) {
  var o = this.zahteviOdeljenja.find(o => o.id.toString() == idOdeljenja);
  var sviPredmeti = this.predmeti.filter(p => p.razred == o?.razred);

  this.zahteviPredmeti = sviPredmeti.filter(p => {
    const postojiZahtev = this.mojiZahtevi.find(z => 
      z.idPredmeta == p.id && 
      z.idOdeljenja == idOdeljenja && 
      (z.status == 0 || z.status == 2)
    );
    return !postojiZahtev;
  });
}

posaljiZahtev() {
  this.zaduzenjaService.dodajZahtev(this.noviZahtev).subscribe(res => {
    if (res) {
      alert('Zahtjev je uspješno poslat! Čekajte odobrenje admina.');
      this.noviZahtev = { idProfesora: Number(this.filterProfesor), idPredmeta: '', idOdeljenja: '', idSkole: 0 };
      this.selectedSkolaZahtev = false;
      this.loadMojiZahtevi();
    } else {
      alert('Zahtjev već postoji ili je došlo do greške.');
    }
  });
}

getStatusLabel(status: number): string {
  switch(status) {
    case 0: return '⏳ Na čekanju';
    case 1: return '✅ Odobren';
    case 2: return '❌ Odbijen';
    default: return '-';
  }
}

getStatusClass(status: number): string {
  switch(status) {
    case 0: return 'status-pending';
    case 1: return 'status-approved';
    case 2: return 'status-rejected';
    default: return '';
  }
}
}