import { Component, OnInit } from '@angular/core';
import { VezbaService } from '../../services/vezba-service/vezba.service';
import { UserService } from '../../services/user-service/user.service';
import { Vezba } from '../../models/vezba';
import { User } from '../../models/user';
import { Odeljenje } from '../../models/odeljenje';
import { ZaduzenjaService } from '../../services/zaduzenja-service/zaduzenja.service';
import { Zadatak } from '../../models/zadatak';
import { ZadatakService } from '../../services/zadatak-service/zadatak.service';
import { Predmet } from '../../models/predmet';
import { SkolaDTO } from '../../models/DTOs/skolaDTO';

@Component({
  selector: 'app-moje-vezbe',
  templateUrl: './moje-vezbe.component.html',
  styleUrls: ['./moje-vezbe.component.css']
})
export class MojeVezbeComponent implements OnInit {
  vezbe: Vezba[] = [];
  odeljenja: Odeljenje[] = [];
  filterOdeljenja: Odeljenje[] = [];
  ucenici: User[] = [];
  skole: SkolaDTO[] = [];
  selectedVezba: Vezba = {naziv: "", trajanjeVezbe: 0, id: 0, idPredmeta: 0, brojZadataka: 0, zadaci: []};
  selectedVezbaId: number | null = null;
  selectedOdeljenjeId: number | null = null;
  selectedUcenikIds: number[] = [];
  ucenikPretraga: string = '';
  showIzmenaForm: boolean = false;
  showOdeljenjeForm: boolean = false;
  showUcenikForm: boolean = false;
  showZadatkeForm: boolean = false;
  noviZadatakId: number | null = null;
  selectedSkolaId: number | null = null;
  UcenikSelectedSkolaId: number | null = null;
  UcenikSelectedOdeljenjeId: number | null = null;

  constructor(private vezbaService: VezbaService,
     private userService: UserService,
     private zaduzenjeService: ZaduzenjaService,
    private zadaciService: ZadatakService) {}

  ngOnInit() {
    this.ucitajVezbe();
    this.ucitajOdeljenja();
    this.ucitajUcenike();
  }

  ucitajVezbe() {
    this.vezbaService.getVezbeByProfesorId(this.userService.getCurrentUserId()).subscribe((vezbe: Vezba[]) => {
      vezbe.forEach(vezba => {
        this.vezbaService.getOdeljenjaByVezbaId(vezba.id).subscribe((res: Odeljenje[]) =>{
        
          this.zaduzenjeService.getSkole().subscribe(
            (skole: SkolaDTO[]) => {
              res.forEach(o => {
                o.skola = skole.find(x => x.id === o.idSkole) ?? { naziv: "", id: 0, grad: "", action: "" };
              });
    
              vezba.odeljenja = res;
            });
        });
        this.vezbaService.getUceniciByVezbaId(vezba.id).subscribe((res: User[]) =>{vezba.ucenici = res;});
        this.zadaciService.getPredmetiById(vezba.idPredmeta).subscribe((p: Predmet) => {vezba.predmet = p;});
        this.zadaciService.getZadaciByVezbaId(vezba.id).subscribe((res: Zadatak[]) => {
          vezba.zadaci = res;
          this.zadaciService.getZadaciByPredmetId(vezba.idPredmeta).subscribe((z: Zadatak[]) => {    
            if(vezba.predmet)
            {
              vezba.predmet.zadaci = z.filter(zadatak => vezba.zadaci.findIndex(vz=> vz.id == zadatak.id) == -1);
            }
          });   
        });   
      });
      this.vezbe = vezbe;
      this.vezbe.sort((a, b) => b.id - a.id);
    });
  }

  ucitajOdeljenja() {
    this.zaduzenjeService.getOdeljenjaByProfesorId(this.userService.getCurrentUserId()).subscribe((odeljenja: Odeljenje[]) => {
      this.odeljenja = odeljenja;
      this.zaduzenjeService.getSkole().subscribe(
        (skole: SkolaDTO[]) => {
          this.odeljenja.forEach(o => { 
            this.zaduzenjeService.getUceniciByOdeljenjeId(o.id).subscribe((ucenici: User[])=>{
              o.ucenici = ucenici;
              var sk = skole.find(x => x.id === o.idSkole);
            if(sk)
            {
              o.skola = sk;

              if(this.skole.findIndex(x => x.id == o.skola.id) == -1)
              {
                this.skole.push(sk);
              }
            }
            });  

          });

        }
      );
    });
  }

  ucitajUcenike() {
    this.userService.getUcenici().subscribe((res: any) => {
      this.ucenici = res;
    });
  }

  filtriraniUcenici(vezba: Vezba) {
    return this.odeljenja.find(x => x.id == this.UcenikSelectedOdeljenjeId)?.ucenici.filter(ucenik => vezba.ucenici?.findIndex(vu => vu.id == ucenik.id) == -1);
  }

  filtriranaOdeljenja() {
    return this.odeljenja.filter(x => x.idSkole == this.UcenikSelectedSkolaId);
  }
  dodeliVezbuOdeljenju() {
    if (this.selectedVezbaId && this.selectedOdeljenjeId) {
      this.vezbaService.addVezbaOdeljenje(this.selectedOdeljenjeId, this.selectedVezbaId).subscribe((success: boolean) => {
        if (success) {
          alert('Vežba uspešno dodeljena odeljenju');
          this.ucitajVezbe();
          this.zatvoriForme();
          this.selectedOdeljenjeId = null;
          this.selectedVezbaId = null;
          this.selectedSkolaId = null
        }
      });
    }
  }

  dodeliVezbuUceniku() {
  if (this.selectedVezbaId && this.selectedUcenikIds.length > 0) {
    const requests = this.selectedUcenikIds.map(id =>
      this.vezbaService.addVezbaUcenik(id, this.selectedVezbaId!)
    );
    
    let completed = 0;
    requests.forEach(req => {
      req.subscribe((success: boolean) => {
        completed++;
        if (completed === requests.length) {
          alert(`Vežba uspešno dodeljena ${completed} učeniku/cima`);
          this.ucitajVezbe();
          this.selectedUcenikIds = [];
          this.selectedVezbaId = null;
          this.UcenikSelectedOdeljenjeId = null;
          this.UcenikSelectedSkolaId = null;
          this.zatvoriForme();
        }
      });
    });
  }
}

  prikaziIzmenaForm(vezbaId: number) {
    this.selectedVezbaId = vezbaId;
    var vezba = this.vezbe.find(x => x.id == vezbaId);
    if(vezba)
    {
      this.selectedVezba = vezba;
    }
    this.showIzmenaForm = true;
    this.showUcenikForm = false;
    this.showOdeljenjeForm = false;
    this.showZadatkeForm = false;
  }

  izmeniVezbu(selectedVezbaId: any) {
    if (this.selectedVezba) {  
      this.vezbaService.updateVezba(this.selectedVezba).subscribe((success: boolean) => {
        if (success) {
          alert('Vežba uspešno izmenjena');
          this.ucitajVezbe();
          this.zatvoriForme();
        }
      });
    }
  }

  prikaziUcenikForm(vezbaId: number) {
    this.selectedVezbaId = vezbaId;
    this.showUcenikForm = true;
    this.showOdeljenjeForm = false;
    this.showIzmenaForm = false;
    this.showZadatkeForm = false;
  }

  prikaziOdeljenjeForm(vezbaId: number) {
    this.selectedVezbaId = vezbaId;
    this.showOdeljenjeForm = true;
    this.showUcenikForm = false;
    this.showIzmenaForm = false;
    this.showZadatkeForm = false;
  }

  prikaziZadatkeForm(vezbaId: number) {
    this.selectedVezbaId = vezbaId;
    this.showZadatkeForm = true;
    this.showUcenikForm = false;
    this.showOdeljenjeForm = false;
    this.showIzmenaForm = false;
  }

  dodajZadatak(vezbaId: number) {
      this.vezbaService.addZadatakToVezba(vezbaId, this.noviZadatakId).subscribe((success: boolean) => {
        if (success) {
          alert('Zadatak uspešno dodat');
          this.ucitajVezbe();
        }
      });
  }

  ukloniZadatak(vezbaId: number, zadatakId: number) {
    this.vezbaService.removeZadatakFromVezba(vezbaId, zadatakId).subscribe((success: boolean) => {
      if (success) {
        alert('Zadatak uspešno uklonjen');
        this.ucitajVezbe();
      }
    });
  }

  zatvoriForme() {
    this.showIzmenaForm = false;
    this.showOdeljenjeForm = false;
    this.showUcenikForm = false;
    this.showZadatkeForm = false;
    this.ucitajVezbe();
  }

  filter(){
    this.filterOdeljenja = this.odeljenja?.filter(x => x.idSkole == this.selectedSkolaId);
    var vezba = this.vezbe.find(x => x.id == this.selectedVezbaId);
    if(vezba?.odeljenja)
    {
      var odeljenja = vezba.odeljenja;
      this.filterOdeljenja = this.filterOdeljenja?.filter(x => odeljenja.findIndex(v => v.id == x.id) == -1);
    }
    this.UcenikSelectedOdeljenjeId = null;
  }
  toggleUcenik(id: number) {
  const idx = this.selectedUcenikIds.indexOf(id);
  if (idx === -1) this.selectedUcenikIds.push(id);
  else this.selectedUcenikIds.splice(idx, 1);
}

isUcenikSelected(id: number): boolean {
  return this.selectedUcenikIds.includes(id);
}

selectAllUcenici(vezba: Vezba) {
  const svi = this.filtriraniUcenici(vezba) ?? [];
  if (this.selectedUcenikIds.length === svi.length) {
    this.selectedUcenikIds = [];
  } else {
    this.selectedUcenikIds = svi.map(u => u.id);
  }
}
onOdeljenjeChange() {
  this.selectedUcenikIds = [];
}
}
