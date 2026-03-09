import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Zadatak } from '../../models/zadatak';
import { VezbaService } from '../../services/vezba-service/vezba.service';
import { UserService } from '../../services/user-service/user.service';
import { ZaduzenjaService } from '../../services/zaduzenja-service/zaduzenja.service';
import { ZadatakService } from '../../services/zadatak-service/zadatak.service';
import { Predmet } from '../../models/predmet';
import { FileService } from '../../services/file-service/file.service';
import { Hint } from '../../models/hint';
import { Definition } from '../../models/definition';
import { Odgovor } from '../../models/odgovor';
import { MathJaxService } from '../../services/math-jax/math-jax.service';
import { Router } from '@angular/router';
import { Tema } from '../../models/tema';
import { marked } from 'marked';
import hljs from 'highlight.js';
@Component({
  selector: 'app-moji-zadaci',
  templateUrl: './moji-zadaci.component.html',
  styleUrls: ['./moji-zadaci.component.css']
})
export class MojiZadaciComponent implements OnInit {
  zadaci: Zadatak[] = [];
  filteredZadaci: Zadatak[] = [];
  predmeti: Predmet[] = []; // Dodavanje opcije "Svi predmeti"
  selectedRazred: number = 1;
  selectedPredmet: number = -1;
  showEditDialog: boolean = false;
  selectedTask: Zadatak | null = null;
  profId: number = 0;
  
  showImageModal: boolean = false;
  selectedImage: string = '';
  showImageModalFromEdit: boolean = false;
  selectedImageFromEdit: string = '';
  teme: Tema[] = [];

  @Input() mathString!: string;

  constructor(
     private userService: UserService,
     private fileService: FileService,
     private zadatakService: ZadatakService,
     private el: ElementRef,
     private mathJaxService: MathJaxService,
    private router: Router) {
    }
  ngOnInit() {  
    this.profId = this.userService.getCurrentUserId();
    this.loadTasks();
    this.filterTasks();
  }

  loadTasks() {
    this.zadatakService.getPredmetiByProfesorId(this.profId).subscribe((resPredmeti: Predmet[]) => {
      this.predmeti = resPredmeti;

      this.zadatakService.getZadaciByCreatorId(this.profId).subscribe((resZadaci: Zadatak[]) => {  
        resZadaci.forEach(element => {
            var pred = this.predmeti.find(p => p.id == element.idPredmeta);
            element.predmet =  pred? pred: this.predmeti[0];
            if(element.picture == true){
              element.path = this.fileService.getImageUrlByName(element.path);
            }
            else{
              element.path = ""; 
            }
            this.zadatakService.dajHintPoIdZadatka(element.id).subscribe((res: Hint) => {
              element.hint = res;
              if(element.hint.slika)
              {
                element.hint.path =  this.fileService.getImageUrlByName(element.hint.slika);
              }
            });
            this.zadatakService.dajDefinicijuPoIdZadatka(element.id).subscribe((res: Definition) => {
              element.definicija = res;
              if(element.definicija.slika)
              {
                element.definicija.path =  this.fileService.getImageUrlByName(element.definicija.slika);
              }
            });
            this.zadatakService.dajOdgovorePoIdZadatka(element.id).subscribe((res: Odgovor[]) => {
              element.odgovori = res;
              element.odgovori.forEach(odgovor => {
                if(odgovor.slika)
                {
                  odgovor.path =  this.fileService.getImageUrlByName(odgovor.slika);
                }
              });
            });
            this.zadatakService.getTemaById(element.idTeme).subscribe((tema: Tema)=>{
              element.tema = tema;
              });
          });  

          resZadaci.sort((a, b) => b.id - a.id);
          this.zadaci = this.filteredZadaci = resZadaci;
          this.mathJaxService.render(this.el.nativeElement);
      });
   });
  }

  loadPicture(fileName: string){
    return this.fileService.getImageUrlByName(fileName);
  }

  filterTasks() {
    if(this.selectedPredmet == -1){
      this.filteredZadaci = this.zadaci;
    }
    else{
      this.filteredZadaci = this.zadaci.filter(zadatak =>
        zadatak.idPredmeta == this.selectedPredmet);
    }
    this.mathJaxService.render(this.el.nativeElement);
  }

  openEditDialog(zadatak: Zadatak) {
    this.selectedTask = zadatak;
    this.zadatakService.getTemeByPredmetId(this.selectedTask.idPredmeta).subscribe((res: Tema[])=>{
      this.teme = res;
      });
    this.showEditDialog = true;
    this.mathJaxService.render(this.el.nativeElement).catch((error) => {
      console.error('Error rendering MathJax:', error);
    });
  }

  closeEditDialog() {
    this.showEditDialog = false;
  }

  deleteZadatak(zadatak: any){
    this.zadatakService.deleteZadatak(zadatak.id).subscribe( (res: boolean) => {
    if(res)
      {
        alert('Zadatak: '+ zadatak.opis +' je obrisan!');
        this.loadTasks();
        this.filterTasks();
      }
    });
  }

  updateTask() {
    if(this.selectedTask)
    {
      this.zadatakService.updateZadatak(this.selectedTask).subscribe();
      this.zadatakService.updateDefinition(this.selectedTask?.definicija).subscribe();
      this.zadatakService.updateHint(this.selectedTask?.hint).subscribe();    
      this.selectedTask.odgovori.forEach(odgovor => {
        this.zadatakService.updateOdgovor(odgovor).subscribe();    
      });
      this.showEditDialog = false;
      this.loadTasks();
    }
  }

  renderLatex(arg0: any) {
    this.mathString = arg0;//izbrisan $$
    this.mathJaxService.render(this.el.nativeElement).catch((error) => {
      console.error('Error rendering MathJax:', error);
    });
    return this.mathString;
  }
  renderMarkdown(tekst: string): string {
  if (!tekst) return '';
  return marked.parse(tekst) as string;
}
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
    }
  }

  openImageModal(path: string) {
    this.selectedImage = path;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
    //this.selectedImage = '';
  }

  openImageModalFromEdit(path: string) {
    this.selectedImageFromEdit = path;
    this.showImageModalFromEdit = true;
  }

  closeImageModalFromEdit() {
    this.showImageModalFromEdit = false;
    //this.selectedImage = '';
  }
}
