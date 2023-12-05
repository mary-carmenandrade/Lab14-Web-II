import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { saveAs } from 'file-saver'


@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  filtroNombre = '';
  generos: string[] = [];
  filtroGenero = 'Todos';
  filtroLanzamiento = '';
  originalPeliculas: any[] = [];

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs as any;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.peliculasFiltradas = data;
      this.generos = this.obtenerGeneros();
      this.originalPeliculas = [...data];
    });
  }

  private obtenerGeneros(): string[] {
    const genres: string[] = [];
    this.peliculas.forEach(pelicula => {
      if (!genres.includes(pelicula.genero)) {
        genres.push(pelicula.genero);
      }
    });
    return genres;
  }


  aplicarFiltros() {
    this.peliculas = this.originalPeliculas.filter(pelicula => {
      let cumpleFiltroGenero = true;
      let cumpleFiltroLanzamiento = true;
      let cumpleFiltroNombre = true;
  
      if (this.filtroGenero !== 'Todos') {
        cumpleFiltroGenero = pelicula.genero === this.filtroGenero;
      }
  
      if (this.filtroLanzamiento !== '') {
        cumpleFiltroLanzamiento = pelicula.lanzamiento.toString() === this.filtroLanzamiento;
      }
  
      if (this.filtroNombre !== '') {
        cumpleFiltroNombre = pelicula.titulo.toLowerCase().includes(this.filtroNombre.toLowerCase());
      }
  
      return cumpleFiltroGenero && cumpleFiltroLanzamiento && cumpleFiltroNombre;
    });
    
  }
  
  generarPDF() {
    const contenido = [
      { text: 'Listado de películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [{ text: 'Título', style: 'tableHeader' }, { text: 'Género', style: 'tableHeader' }, { text: 'Año de lanzamiento', style: 'tableHeader' }],
            ...this.peliculas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        }
      }
    ];
  
    const estilos: any = {
      header: {
        fontSize: 24,
        bold: true,
        color: "webgreen",
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      cuerpoTabla: {
        margin: [0, 10, 0, 0],
        fontSize: 14,
        color: '#333'
      },
      tableHeader: {
        bold: true,
        fontSize: 16,
        color: '#fff',
        fillColor: '#4a90e2'
      }
    };
  
    pdfMake.createPdf({ content: contenido, styles: estilos }).open();
  }
  

  generarCSV() {
    const csvData = this.peliculas.map(pelicula => ({
      titulo: pelicula.titulo,
      genero: pelicula.genero,
      lanzamiento: pelicula.lanzamiento
    }));

    const csvContent = '\ufeff' + this.convertToCSV(csvData);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'peliculas.csv');
  }

  private convertToCSV(data: any[]): string {
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ];
    return csv.join('\n');
  }

  generarJSON() {
    const jsonContent = JSON.stringify(this.peliculas, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'peliculas.json');
  }

  generarXML() {
    const xmlContent = this.convertToXML(this.peliculas);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    saveAs(blob, 'peliculas.xml');
  }

  convertToXML(data: any[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8" ?>';
    const xmlBody = data.map(item => {
      const properties = Object.entries(item).map(([key, value]) => `<${key}>${value}</${key}>`).join('');
      return `<item>${properties}</item>`;
    }).join('');

    return `${xmlHeader}<items>${xmlBody}</items>`;
  }

}
