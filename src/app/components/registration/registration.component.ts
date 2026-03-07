import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user-service/user.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Odeljenje } from '../../models/odeljenje';
import { CommonModule } from '@angular/common';
import { Predmet } from '../../models/predmet';
import { ZaduzenjaService } from '../../services/zaduzenja-service/zaduzenja.service';
import { UserDTO } from '../../models/DTOs/userDTO';
import { OdeljenjeDTO } from '../../models/DTOs/odeljenjeDTO';
import { PredmetDTO } from '../../models/DTOs/predmetDTO';
import { Router } from '@angular/router';
import * as Papa from 'papaparse';
import { SkolaDTO } from '../../models/DTOs/skolaDTO';
import { Tema } from '../../models/tema';
import { ZadatakService } from '../../services/zadatak-service/zadatak.service';
import { EmailService } from '../../services/email-service/email.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
 
  registrationForm: FormGroup;
  OdeljenjeForm: FormGroup;
  PredmetForm: FormGroup;
  csvRegistrationForm: FormGroup;
  SkolaForm: FormGroup;
  editSkolaForm: FormGroup;

  odeljenja: Odeljenje[] | undefined;
  predmeti: Predmet[] | undefined;
  filteredPredmeti: Predmet[] | undefined;
  skole: SkolaDTO[] | undefined;
  filterOdeljenja: Odeljenje[] | undefined;
  activeForm: string = 'registration';

  filterRazred: string | null = null;

  razredi = [1,2,3,4,5,6,7,8,9,10,11,12];

  csvData: any;

  editSkolaOpen: boolean = false;

  isTemaModalOpen = false;
  novaTemaNaziv: string = '';
  selectedPredmet: any = null;

  constructor(private userService: UserService,
              private formBuilder: FormBuilder,
              private zaduzenjaService: ZaduzenjaService,
              private router: Router,
              private zadatakService: ZadatakService,
              private emailService: EmailService) {
    this.registrationForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
      password: ['', Validators.required],
      role: [0, Validators.required],
      odeljenje: [''],
      predmet: [''],
      skola: [0]
    });

    this.OdeljenjeForm = this.formBuilder.group({
      brojOdeljenja: ["", Validators.required],
      razred: ['',[Validators.required, Validators.min(1), Validators.max(12)]],
      idSkole:[0, Validators.required]
    });

    this.PredmetForm = this.formBuilder.group({
      naziv: ['', Validators.required],
      razred: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
    });

    this.csvRegistrationForm = this.formBuilder.group({
    });

    this.SkolaForm = this.formBuilder.group({
      naziv: ['', Validators.required],
      grad: ['', Validators.required],
    });

    this.editSkolaForm = this.formBuilder.group({
      naziv: ['', Validators.required],
      grad: ['', Validators.required],
      id: [0]
    });
  }
  ngOnInit(): void {
    
    this.loadOdeljenja();
    
    this.loadPredmeti();

    this.loadSkole();

    this.onRoleChange();
  }

  loadOdeljenja(){
    this.zaduzenjaService.getOdeljenja().subscribe(
      (response: any) => {
        this.odeljenja = response;
      }
    );
  }

  loadPredmeti(){
    this.zaduzenjaService.getPredmeti().subscribe(
      (response: any) => {
        this.predmeti = response;
        this.filteredPredmeti = this.predmeti;
      }
    );
  }

  loadSkole(){
    this.zaduzenjaService.getSkole().subscribe(
      (response: any) => {
        this.skole = response;
      }
    );
  }

  showForm(formName: string) {
    this.activeForm = formName;
  }
  
  getSelectedOdeljenjeId(): number | null {
    return this.registrationForm.get('odeljenje')?.value || null;
  }

  onRoleChange(): void {
    this.registrationForm.get('roleId')?.valueChanges.subscribe(roleId => {
      const odeljenje = this.registrationForm.get('odeljenje');
      const predmet = this.registrationForm.get('predmet');
      if (roleId === 3) {
        odeljenje?.setValidators([Validators.required]);
       } else if (roleId === '2') {
        predmet?.setValidators([Validators.required]);
        odeljenje?.clearValidators();
      } else {
        odeljenje?.clearValidators();
        predmet?.clearValidators();
      }
      odeljenje?.updateValueAndValidity();
      predmet?.updateValueAndValidity();
    });
  }

  register(){
    const user: UserDTO = this.registrationForm.value;
    this.userService.checkUsername(user.username).subscribe((res: boolean) =>
      {
        if(res)
          {
            this.userService.registerUser(user).subscribe(
              (userId: any) => {
                if(user.role == 3)
                {
                  var odeljenjeId = this.registrationForm.get('odeljenje')?.value;
                  this.zaduzenjaService.addOdeljenjeUcenik(userId, odeljenjeId).subscribe(
                    (response: any) =>{
                      if(!response)
                        {
                          alert('Problem sa dodavanjem odeljenja za korisnika '+ user.username +' !');
                        }
                    }
                  );
                }
                this.emailService.sendMail("Vaš nalog na Platformi za programirano učenje je uspešno i podaci za prijavu su EMAIL: "+user.username+"  LOZINKA: "+user.password+" !", user.username).subscribe();
                alert('Korisnik: '+ user.username +' je uspešno dodat!');
                this.registrationForm.reset();       
                this.router.navigate(['/registration']);
              },
            );
          } 
          else{
            alert('Korisničko ime: '+ user.username +' je zauzeto!');
          }

      }
    );
  }
  // Dodaj u klasu:

addCsvRow() {
  this.csvData.push({
    'Ime': '', 'Prezime': '', 'Email': '',
    'Role': '3', 'Odeljenje': '', 'Razred': '', 'idSkole': ''
  });
}

removeCsvRow(index: number) {
  this.csvData.splice(index, 1);
}

isRowValid(row: any): boolean {
  return !!(row['Ime'] && row['Prezime'] && row['Email'] &&
    row['Email'].includes('@') && row['Role']);
}

validRowCount(): number {
  return this.csvData?.filter((r: any) => this.isRowValid(r)).length ?? 0;
}
  addOdeljenje(){
    const odeljenje: OdeljenjeDTO = this.OdeljenjeForm.value;
    this.zaduzenjaService.addOdeljenje(odeljenje).subscribe(
      (response: any) => {
         if(response)
         {
          alert('Odeljenje je uspešno dodato!');
          this.OdeljenjeForm.reset(); 
          this.loadOdeljenja();
         }
         else{
          alert('Odeljenje već postoji!');
         }
        },
      );
  }

  addPredmet(){
    const predmet: PredmetDTO = this.PredmetForm.value;
    this.zaduzenjaService.addPredmet(predmet).subscribe(
      (response: any) => {
        if(response)
        {
          alert('Predmet je uspešno dodat!');
          this.PredmetForm.reset(); 
          this.loadPredmeti();
        }
        else{
          alert('Predmet već postoji!');
         }
        },
      );
  }

  addSkola(){
    const skola: SkolaDTO = this.SkolaForm.value;
    this.zaduzenjaService.addSkola(skola).subscribe(
      (response: any) => {
         if(response)
         {
          alert('Škola je uspešno dodata!');
          this.SkolaForm.reset(); 
          this.loadSkole();
         }
         else{
          alert('Škola već postoji!');
         }
        },
      );
  }

  async processCSV() {
    var success = 0;
    var failed = 0;
    var sum = 0;
    var badUserNames: any[] = [];
  
    for (const row of this.csvData) {
      sum++;
      const newUser: UserDTO = {
        firstName: row['Ime'],
        lastName: row['Prezime'],
        username: row['Email'],
        password: '123',
        role: row['Role'],
        id: 0,
        action: 'addUser',
        idSkole: row['idSkole']
      };
  
      // Sačekaj odgovor iz checkUsername
      const res = await this.userService.checkUsername(newUser.username).toPromise();
      console.log('Email:', newUser.username, '| checkUsername vratio:', res, '| tip:', typeof res);

      if (res) {
        try {
          // Sačekaj odgovor iz registerUser
          const userId = await this.userService.registerUser(newUser).toPromise();
          if (userId != null) {
            if (newUser.role == 3) {
              var odeljenje = this.odeljenja?.find(x => 
                x.brojOdeljenja == row['Odeljenje'] && 
                x.razred == row['Razred'] && 
                x.idSkole == row['idSkole']
              );
              if (odeljenje) {
                const odeljenjeRes = await this.zaduzenjaService.addOdeljenjeUcenik(userId, odeljenje.id).toPromise();
                if (odeljenjeRes) {
                  success++;
                } else {
                  failed++;
                }
              } else {
                // Korisnik dodat ali odeljenje nije pronadjeno
                success++;
                console.warn('Odeljenje nije pronađeno za:', newUser.username, 
                  '| Odeljenje:', row['Odeljenje'], 
                  '| Razred:', row['Razred'], 
                  '| idSkole:', row['idSkole']);
              }
            } else {
              success++;
            }
          } else {
            failed = failed + 1;
          }
        } catch (error) {
          console.error("Greška prilikom registracije korisnika:", error);
          failed = failed + 1;
        }
      } else {
        failed = failed + 1;
        badUserNames.push(newUser.username);
      }
    }
  
    // Prikaz rezultata nakon što se svi HTTP pozivi završe
    if (badUserNames.length > 0) {
      var text = "";
      badUserNames.forEach(element => {
        text = text + element + " ";
      });
      text = text + ";";
      alert("Korisnici koji imaju nevalidan username: " + text);
    }
  
    alert("Od ukupno " + sum + "učitanih podataka. Uspešno dodato: " + success + " korisnika, neuspešno dodato " + failed + " korisnika.");
  }
  

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          this.csvData = result.data;
        }
      });
    }
  }

  filter(){
    this.filterOdeljenja = this.odeljenja?.filter(x => x.idSkole == this.registrationForm.get('skola')?.value);
  }

  filterSubjects()
  {
    this.filteredPredmeti = this.filterRazred == ''? this.predmeti : this.predmeti?.filter(x => x.razred.toString() == this.filterRazred);
  }

  openEditSkola(skola: any){
    this.editSkolaForm = this.formBuilder.group({
      naziv: [skola.naziv, Validators.required],
      grad: [skola.grad, Validators.required],
      id: [skola.id]
    });
    this.editSkolaOpen = true;

    
  }

  editSkola(){
    const skola: SkolaDTO = this.editSkolaForm.value;

    this.zaduzenjaService.editSkola(skola.naziv, skola.grad, skola.id).subscribe((response: boolean) =>
      {
        if(response){
          alert('Podaci škole su izmenjeni uspešno!');
          this.editSkolaForm.reset();
          this.closeEditSkola();     
          this.loadSkole();
         }
        else{
          alert('Škola sa identicnim nazivom i gradom već postoji!');
          this.editSkolaForm.reset();
        }
      });
  }

  closeEditSkola(){
    this.editSkolaOpen = false;
  }

  openTeme(predmet: Predmet){
    predmet.teme = [];
    this.selectedPredmet = predmet;
    this.zadatakService.getTemeByPredmetId(predmet.id).subscribe(
          (teme: Tema[]) =>{
            this.selectedPredmet.teme = teme;
          }
    );
    this.isTemaModalOpen = true;
  }

  // Function to close the modal
  closeModal() {
    this.isTemaModalOpen = false;
    this.novaTemaNaziv = ''; // Clear the input field when closing
  }

  // Function to add a new topic to the selected subject
  addTema(idPredmeta: number) {
    if (this.novaTemaNaziv.trim()) {
      this.zadatakService.addTema(this.novaTemaNaziv, idPredmeta).subscribe((res: Tema) => {
        this.selectedPredmet.teme.push(res);
        this.novaTemaNaziv = ''; // Clear the input field after adding
      })
    }
  }

  isAdmin(){
    return this.userService.isAdmin();
  }
  isUcenik(){
    return this.userService.isUcenik();
  }
  isProfesor(){
    return this.userService.isProfesor();
  }

  startNewSeason(){
    //return this.userService.startNewSeason();
  }
}

