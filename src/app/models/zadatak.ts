import { Definition } from "./definition";
import { Hint } from "./hint";
import { Odgovor } from "./odgovor";
import { Predmet } from "./predmet";
import { Slika } from "./slika";
import { Tema } from "./tema";

export interface Zadatak {
    id: number;
    nivo: number;
    opis: string;
    tekst: string;
    idPredmeta: number;
    idHint: number;
    idDefinicije: number;
    idKreatora: number;
    action: string;
    latex: boolean;
    picture: boolean;
    hint: Hint;
    definicija: Definition;
    odgovori: Odgovor[];
    loadedPicture: boolean;
    path: string;
    predmet: Predmet;
    idTeme: number;
    tema?: Tema;
    markdown: boolean;
  }
  