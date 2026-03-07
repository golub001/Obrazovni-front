import { Component, ElementRef, OnInit } from '@angular/core';
import { VezbaService } from '../../services/vezba-service/vezba.service';
import { UserService } from '../../services/user-service/user.service';
import { ZadatakService } from '../../services/zadatak-service/zadatak.service';
import { ZaduzenjaService } from '../../services/zaduzenja-service/zaduzenja.service';
import { Odeljenje } from '../../models/odeljenje';
import { Vezba } from '../../models/vezba';
import { User } from '../../models/user';
import { SkolaDTO } from '../../models/DTOs/skolaDTO';
import { Predmet } from '../../models/predmet';
import { Zadatak } from '../../models/zadatak';
import { Pokusaj } from '../../models/pokusaj';
import { Odgovor } from '../../models/odgovor';
import { MathJaxService } from '../../services/math-jax/math-jax.service';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-statistike',
  templateUrl: './statistike.component.html',
  styleUrls: ['./statistike.component.css']
})
export class StatistikeComponent implements OnInit {
  vezbe: Vezba[] = [];
  odeljenja: Odeljenje[] = [];
  filterOdeljenja: Odeljenje[] = [];
  ucenici: User[] = [];
  skole: SkolaDTO[] = [];
  predmeti: Predmet[] = [];
  selectedVezba: Vezba | null = null;
  selectedOdeljenjeId: number = 0;
  selectedUcenikId: number = 0;
  ucenikPretraga: string = '';
  selectedPokusaj: Pokusaj | null = null;
  filteredPokusaji: Pokusaj[] = [];
  filteredUcenici: User[] = [];
  showAttempts: boolean = false;
  showFilterUcenici: boolean = false;
  selectedSubject: number = 0;
  filteredVezbe: Vezba[] = [];
  filteredOdeljenja: Odeljenje[] = [];
  filteredPojedinacniUcenici: User[] = [];
  previewUcenikId: number = 0;
  isAttemptSelected: boolean = false;
  isUcenikSelected: boolean = false;

  constructor(
    private vezbaService: VezbaService,
    private userService: UserService,
    private zaduzenjeService: ZaduzenjaService,
    private zadaciService: ZadatakService,
    private el: ElementRef,
    private mathJaxService: MathJaxService
  ) {}

  ngOnInit() {
    this.ucitajVezbe();
    this.ucitajOdeljenja();
    this.ucitajPredmete();
  }

  ucitajVezbe() {
    this.vezbaService.getVezbeByProfesorId(this.userService.getCurrentUserId()).subscribe((vezbe: Vezba[]) => {
      vezbe.forEach(vezba => {
        this.vezbaService.getOdeljenjaByVezbaId(vezba.id).subscribe((res: Odeljenje[]) => {
          this.zaduzenjeService.getSkole().subscribe(
            (response: any) => {
              this.skole = response;
              res.forEach(o => {
                o.skola = this.skole.find(x => x.id === o.idSkole) ?? { naziv: "", id: 0, grad: "", action: "" };
              });
              vezba.odeljenja = res;
            }
          );
        });
        this.vezbaService.getUceniciByVezbaId(vezba.id).subscribe((res: User[]) => vezba.ucenici = res);
        this.zadaciService.getPredmetiById(vezba.idPredmeta).subscribe((p: Predmet) => vezba.predmet = p);
        this.zadaciService.getZadaciByPredmetId(vezba.idPredmeta).subscribe((z: Zadatak[]) => {
          if (vezba.predmet) {
            vezba.predmet.zadaci = z;
          }
        });
        this.zadaciService.getZadaciByVezbaId(vezba.id).subscribe((res: Zadatak[]) => vezba.zadaci = res);
        this.vezbaService.getPokusajiByVezbaId(vezba.id).subscribe((pokusaji: Pokusaj[]) => {
          pokusaji.forEach(pokusaj => {
            this.userService.getUserById(pokusaj.idUcenika || -1).subscribe((u: any) => pokusaj.ucenik = u);
            this.vezbaService.getPokusajZadatakByPokusajId(pokusaj.id).subscribe(pokusajiZadataka => {
              pokusaj.pokusajiZadataka = pokusajiZadataka;
              pokusaj.pokusajiZadataka.forEach(pz => {
                this.zadaciService.dajZadatakPoId(pz.idVezbaZadatak).subscribe((z: Zadatak) => {
                  pz.zadatak = z;
                  this.vezbaService.getPokusajZadatakOdgovoriByPokusajZadatakId(pz.id).subscribe(odgovori => {
                    pz.pokusajiZadatakOdgovor = odgovori;
                    pz.pokusajiZadatakOdgovor.forEach(element => {
                      this.zadaciService.dajOdgovorPoId(element.idZadatakOdgovor).subscribe((o: Odgovor) => element.odgovor = o);
                    });
                  });
                });
              });
            });
          });
          vezba.pokusaji = pokusaji;
        });
      });
      vezbe.sort((a, b) => b.id - a.id);
      this.vezbe = vezbe;
      this.filteredVezbe = vezbe;
    });
  }

  ucitajOdeljenja() {
    this.zaduzenjeService.getOdeljenja().subscribe((odeljenja: Odeljenje[]) => {
      this.odeljenja = odeljenja;
      this.zaduzenjeService.getSkole().subscribe((response: any) => {
        this.skole = response;
        this.odeljenja.forEach(o => {
          o.skola = this.skole.find(x => x.id === o.idSkole) ?? { naziv: "", id: 0, grad: "", action: "" };
        });
      });
    });
  }

  ucitajPredmete() {
    this.zadaciService.getPredmetiByProfesorId(this.userService.getCurrentUserId()).subscribe((res: Predmet[]) => {
      this.predmeti = res;
    });
  }

  filtriraniUcenici() {
    return this.ucenici.filter(ucenik =>
      (ucenik.firstName + ' ' + ucenik.lastName).toLowerCase().includes(this.ucenikPretraga.toLowerCase())
    );
  }
  
  selectAttempt(t: Pokusaj) {
    if(!this.isAttemptSelected || this.selectedPokusaj?.id != t.id)
    {
      this.selectedPokusaj = t;
      this.isAttemptSelected = true;
    }
    else{
      this.selectedPokusaj = null;
      this.isAttemptSelected = false;
    }
  }

  render(){
    this.mathJaxService.render(this.el.nativeElement).catch((error) => {
      console.error('Error rendering MathJax:', error);
    });
  }

  filterAttempts() {
    if (this.selectedOdeljenjeId) {
      this.zaduzenjeService.getUceniciByOdeljenjeId(this.selectedOdeljenjeId).subscribe((ucenici: User[]) => {
        ucenici.forEach(u => {
          if(this.selectedVezba?.pokusaji?.findIndex(x => x.idUcenika == u.id) != -1)
          {
            u.odeljenje = this.filteredOdeljenja.find(x => x.id == this.selectedOdeljenjeId);
            this.filteredUcenici.push(u);
          }
        });
      });
    }
  }

  filterAttemptsUcenik() {
    if (this.selectedUcenikId) {
      this.userService.getUserById(this.selectedUcenikId).subscribe((ucenik: any) => {
        this.zaduzenjeService.getOdeljenjeByUserId(ucenik.id).subscribe((odeljenje: Odeljenje)=>{
          ucenik.odeljenje = odeljenje;
          var skola = this.skole.find(x => x.id == odeljenje.idSkole);
          if(skola)
          {
            odeljenje.skola = skola;
          }
        });
        this.filteredUcenici = [ucenik];
      });
    }
  }

  selectExercise(t: Vezba) {
  this.showAttempts = true;
  this.selectedVezba = t;
  this.filteredUcenici = [];
  this.filteredPokusaji = [];

  // Učitaj SVE učenike koji imaju pokušaje za ovu vežbu direktno
  if (t.pokusaji) {
    const ucenikIds = [...new Set(t.pokusaji.map(p => p.idUcenika))];
    ucenikIds.forEach(id => {
      this.userService.getUserById(id || -1).subscribe((u: any) => {
        this.zaduzenjeService.getOdeljenjeByUserId(u.id).subscribe((odeljenje: Odeljenje) => {
          const skola = this.skole.find(x => x.id == odeljenje.idSkole);
          if (skola) odeljenje.skola = skola;
          u.odeljenje = odeljenje;
          this.filteredUcenici.push(u);
        });
      });
    });
  }
}

  selectUcenik(ucenik: User){
    if(!this.isUcenikSelected || this.previewUcenikId != ucenik.id)
    {
      this.previewUcenikId = ucenik.id;
      this.filteredPokusaji = this.selectedVezba?.pokusaji?.filter(x => x.idUcenika == ucenik.id) || [];
      this.isUcenikSelected = true;
      this.isAttemptSelected = false;
    }
    else{
      this.previewUcenikId = 0;
      this.filteredPokusaji = [];
      this.isUcenikSelected = false;
      this.isAttemptSelected = false;
    }
  }

  filterExercises() {
    if (this.selectedSubject == 0)
    {
      this.filteredVezbe = this.vezbe;
    }
    else{
      this.filteredVezbe = this.vezbe.filter(x => x.idPredmeta == this.selectedSubject);  
    }
  }

  goBack() {
  this.showAttempts = false;
  this.showFilterUcenici = false;
  this.selectedVezba = null;
  this.selectedPokusaj = null;
  this.filteredPokusaji = [];
  this.filteredUcenici = [];
  this.isAttemptSelected = false;
  this.isUcenikSelected = false;
}

  getNivo(nivo: any): string {
    switch (nivo) {
      case "1":
        return 'osnovni-nivo';
      case "2":
        return 'srednji-nivo';
      case "3":
        return 'napredni-nivo';
      default:
        return '';
    }
  }

  getTacnost(tacnost: any) {
  switch (String(tacnost)) {
    case "1": return 'Tačan odgovor';
    case "2": return 'Približan odgovor';
    case "3":
    case "4": return 'Netačan odgovor';
    default: return '';
  }
}

  getOdgovorClass(tacnost: any): string {
    this.render();
    switch (tacnost) {
      case "1":
        return 'tacan';
      case "2":
        return 'delimicno';
      case "3":
      case "4":
        return 'netacan';
      default:
        return '';
    }
  }

  allExcercises(){
    this.selectedVezba = null;
  }
  stripLatex(tekst: string): string {
  if (!tekst) return '';
  return tekst
    .replace(/\$\$[\s\S]*?\$\$/g, '')  // ukloni $$...$$
    .replace(/\$([^$]*)\$/g, '$1')      // $...$ → samo tekst unutra
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')  // \mathrm{x} → x
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')  // \frac{a}{b} → a/b
    .replace(/\\left|\\right/g, '')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')  // \cmd{x} → x
    .replace(/\\[a-zA-Z]+/g, '')        // ostale \komande
    .replace(/[{}]/g, '')               // zagrade
    .replace(/\^/g, '^')
    .replace(/\s+/g, ' ')
    .trim();
}
  exportToCSV() {
  const csvData: any[][] = [];
  const header = [
    'ID Vežbe', 'Naziv vežbe', 'Predmet', 'Razred',
    'Škola', 'Odeljenje',
    'ID Učenika', 'Ime učenika', 'Prezime učenika', 'Username',
    'Datum pokušaja',
    'Tačni odgovori', 'Netačni odgovori',
    'Urađenih zadataka', 'Neurađenih zadataka',
    'Redni br. zadatka', 'Tekst zadatka',
    'Broj pokušaja na zadatku',
    'Redni br. odgovora', 'Odgovor tekst', 'Rezultat', 'Vreme (s)'
  ];
  csvData.push(header);

  const vezba = this.selectedVezba;
  if (!vezba?.pokusaji) { return; }

  vezba.pokusaji.forEach(pokusaj => {
    const ucenikSaOdeljenjem = this.filteredUcenici.find(u => u.id == pokusaj.idUcenika);

    const baseRow = [
      vezba.id,
      vezba.naziv ?? '',
      vezba.predmet?.naziv ?? '',
      vezba.predmet?.razred ?? '',
      ucenikSaOdeljenjem?.odeljenje?.skola?.naziv ?? '',
      ucenikSaOdeljenjem?.odeljenje ? `"'${ucenikSaOdeljenjem.odeljenje.razred}-${ucenikSaOdeljenjem.odeljenje.brojOdeljenja}"` : '',
      pokusaj.idUcenika,
      ucenikSaOdeljenjem?.firstName ?? pokusaj.ucenik?.firstName ?? '',
      ucenikSaOdeljenjem?.lastName ?? pokusaj.ucenik?.lastName ?? '',
      ucenikSaOdeljenjem?.username ?? pokusaj.ucenik?.username ?? '',
      pokusaj.datumPokusaja,
      pokusaj.brojTacnihOdgovora,
      pokusaj.brojNetacnihOdgovora,
      pokusaj.brojUradjenihZadataka,
      pokusaj.brojNeuradjenihZadataka ?? ''
    ];

    if (pokusaj.pokusajiZadataka?.length) {
      pokusaj.pokusajiZadataka.forEach((pz, zi) => {
        if (pz.pokusajiZadatakOdgovor?.length) {
          pz.pokusajiZadatakOdgovor.forEach(odg => {
            csvData.push([
              ...baseRow,
              zi + 1,
              `"${this.stripLatex(pz.zadatak?.opis ?? pz.zadatak?.tekst ?? '').replace(/"/g, '""')}"`,
              pz.brojPokusaja,
              odg.redniBroj,
              `"${this.stripLatex(odg.odgovor?.tekst ?? '').replace(/"/g, '""')}"`,
              this.getTacnost(String(odg.odgovor?.tacnost ?? '')),
              odg.vreme
            ]);
          });
        } else {
          csvData.push([...baseRow, zi + 1,
            `"${this.stripLatex(pz.zadatak?.opis ?? pz.zadatak?.tekst ?? '').replace(/"/g, '""')}"`,
            pz.brojPokusaja, '', '', '', '']);
        }
      });
    } else {
      csvData.push([...baseRow, '', '', '', '', '', '', '']);
    }
  });

  const BOM = '\uFEFF';
  const csvContent = BOM + csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const naziv = (vezba.naziv ?? 'vezba').replace(/[^a-zA-Z0-9]/g, '_');
  saveAs(blob, `statistike_${naziv}.csv`);
}
  
}
