import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroment';
import { Zaduzenje } from '../../models/zaduzenje';
import { Odeljenje } from '../../models/odeljenje';
import { Predmet } from '../../models/predmet';
import { User } from '../../models/user';
import { OdeljenjeDTO } from '../../models/DTOs/odeljenjeDTO';
import { PredmetDTO } from '../../models/DTOs/predmetDTO';
import { SkolaDTO } from '../../models/DTOs/skolaDTO';
import { Tema } from '../../models/tema';

@Injectable({
  providedIn: 'root'
})
export class ZaduzenjaService {  

  url = environment.apiUrl + "Controllers/";

  constructor(private http: HttpClient) { }

  getAllZaduzenja(): Observable<Zaduzenje[]> {
    return this.http.get<Zaduzenje[]>(this.url + "zaduzenja.php?action=getZaduzenja");
  }

  getZaduzenjaByProfesorId(id: any): Observable<Zaduzenje[]> {
    return this.http.get<Zaduzenje[]>(this.url + "zaduzenja.php?action=getZaduzenjaByProfesorId&id="+id);
  }

  addZaduzenje(zaduzenje: any): Observable<any> {
    return this.http.post<any>(this.url + "zaduzenja.php", zaduzenje);
  }

  addOdeljenje(odeljenje: OdeljenjeDTO): Observable<boolean>{

    odeljenje.action = "dodajOdeljenje";
    odeljenje.naziv = odeljenje.razred + '/'+ odeljenje.brojOdeljenja;

    return this.http.post<boolean>(this.url + "zaduzenja.php", odeljenje);
  }

  addPredmet(predmet: PredmetDTO): Observable<boolean>{
    predmet.action = "dodajPredmet";
    return this.http.post<boolean>(this.url + "zaduzenja.php", predmet);
  }

  addOdeljenjeUcenik(idUcenika: number, idOdeljenja: number): Observable<boolean>{
    return this.http.post<boolean>(this.url + "zaduzenja.php", { idUcenika: idUcenika, idOdeljenja: idOdeljenja, action: "dodajOdeljenjeUcenik" });
  }

  deleteZaduzenje(id: number): Observable<any> {
    return this.http.get<any>(this.url + "zaduzenja.php?action=deleteZaduzenje&id=" + id);
  }

  getProfesori(): Observable<User[]> {
    return this.http.get<User[]>(this.url + "zaduzenja.php?action=getProfesori");
  }

  getOdeljenja(): Observable<Odeljenje[]>{
    return this.http.get<Odeljenje[]>(this.url + "zaduzenja.php?action=getOdeljenja");
  }

  getOdeljenjeByUserId(id: number): Observable<Odeljenje>{
    return this.http.get<Odeljenje>(this.url + "zaduzenja.php?action=getOdeljenjeByUserId&id="+id);
  }

  getPredmeti(): Observable<Predmet[]>{
    return this.http.get<Predmet[]>(this.url + "zaduzenja.php?action=getPredmet");
  }

  getUceniciByOdeljenjeId(ucenikId: number): Observable<User[]> {
    return this.http.get<User[]>(this.url + "zaduzenja.php?action=getUceniciByOdeljenjeId&id="+ucenikId);
  }

  addSkola(skola: SkolaDTO) {
    skola.action = "dodajSkolu";
    return this.http.post<Object>(this.url + "zaduzenja.php", skola);
  }

  getSkole(): Observable<SkolaDTO[]> {
    return this.http.get<SkolaDTO[]>(this.url + "zaduzenja.php?action=getSkole");
  }

  editSkola(naziv: string, grad: string, id: any): Observable<boolean>{
     return this.http.get<boolean>(this.url + "zaduzenja.php?action=editSkola&naziv=" + naziv + "&grad=" + grad + "&id=" + id);
  }

  getOdeljenjaByProfesorId(id: number): Observable<Odeljenje[]>{
    return this.http.get<Odeljenje[]>(this.url + "zaduzenja.php?action=getOdeljenjaByProfesorId&id=" + id);
  }
    dodajZahtev(zahtev: any): Observable<boolean> {
      return this.http.post<boolean>(this.url + "zaduzenja.php", 
          { ...zahtev, action: "dodajZahtev" });
  }

  getZahtevi(): Observable<any[]> {
      return this.http.get<any[]>(this.url + "zaduzenja.php?action=getZahtevi");
  }

  getZahteviByProfesorId(id: number): Observable<any[]> {
      return this.http.get<any[]>(this.url + "zaduzenja.php?action=getZahteviByProfesorId&id=" + id);
  }

  odobravaZahtev(id: number): Observable<boolean> {
      return this.http.get<boolean>(this.url + "zaduzenja.php?action=odobravaZahtev&id=" + id);
  }

  odbijZahtev(id: number): Observable<boolean> {
      return this.http.get<boolean>(this.url + "zaduzenja.php?action=odbijZahtev&id=" + id);
  }
}
