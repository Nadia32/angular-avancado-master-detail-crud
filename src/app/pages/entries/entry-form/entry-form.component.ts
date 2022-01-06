import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupName, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";

import { Entry } from '../shared/entry.model';
import { EntryService } from '../shared/entry.service';

import { ToastrService } from 'ngx-toastr';

import{ switchMap } from "rxjs/operators";
import { toBase64String } from '@angular/compiler/src/output/source_map';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.css']
})
export class EntryFormComponent implements OnInit, AfterContentChecked {

  submittingForm: boolean = false;
  entry: Entry = new Entry();
  currentAction: string = "";
  pageTitle: string = "";
  serverErrorMessages: string[] = [];
  idEntry: number = 0;
  imaskConfig = {
    mask: Number,
    scale: 2,
    thousandsSparator: '',
    padFractonalZeros: true,
    normalizeZeros: true,
    radix: ','
    };
    ptBR = {
      firstDayOfWeek: 0,
      dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      dayNamesMin: ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sa'],
      monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
        'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ],
      monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      today: 'Hoje',
      clear: 'Limpar'
    };

  entryForm: FormGroup = this.formBuilder.group({
    id: [null],
    name: [null, [Validators.required, Validators.minLength(2)]],
    description: [null]
  });

  constructor(
    private entryService: EntryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    
  }

  ngOnInit(): void {
    this.setCurrentAction();
    this.buildEntryForm();
    this.loadEntry();
  }


  ngAfterContentChecked(){
    this.setPageTitle();
  }
  submitForm() {
    this.submittingForm = true;

    if(this.currentAction == "new")
    this.createEntry();
    else // currentAction == "edit"
      this.updateEntry();
  }
  
  get typeOptions(): Array<any>{
    return Object.entries(Entry.types).map(
      ([value, text]) => {
        return {
          text: text,
          value: value
        }
      }
    )
  }

  /****** PRIVATE METHODS *******/

  private setCurrentAction() {
    if(this.route.snapshot.url[0].path == "new")
      this.currentAction = "new"
    else
      this.currentAction = "edit"
  }

  private buildEntryForm() {
    this.entryForm = this.formBuilder.group({
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null],
      type: [null,[Validators.required]],
      amount: [null,[Validators.required]],
      date: [null,[Validators.required]],
      paid: [null,[Validators.required]],
      categoryId: [null, [Validators.required]]
    });
  }

  private loadEntry() {
    if (this.currentAction == "edit") {
      this.route.params.subscribe(params => this.idEntry = params['id']);
      console.log(this.idEntry); 
      this.entryService.getById(this.idEntry).subscribe(
        (entry) => {
          console.log(entry);
          this.entry = entry;
          this.entryForm.patchValue(this.entry) // binds loaded entry data to EntryForm
        },
        (error) => alert('Ocorreu um erro no servidor, tente novamente mais tarde')
      )
    }
  }

  private setPageTitle() {
    if (this.currentAction == 'new')
      this.pageTitle = 'Cadastro de Nova Categoria'
    else {
      const entryName = this.entry.name || ""
      this.pageTitle = 'Editando Categoria: ' + entryName;
    }
  }
  private createEntry(){
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value);

    this.entryService.create(entry)
    .subscribe(
      entry => this.actionsForSuccess(entry),
      error => this.actionsForError(error)
    )
  }
  private updateEntry() {
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value)

    this.entryService.update(entry).subscribe(
      entry => this.actionsForSuccess(entry),
      error => this.actionsForError(error)
    )
  }

  private actionsForSuccess(entry: Entry){
    this.toastr.success("Solicitação processada com sucesso!");
    // redirect/reload component page
    this.router.navigateByUrl("entries", {skipLocationChange: true}).then(
      () => this.router.navigate(["entries", entry.id, "edit"])
    )
  }

  private actionsForError(error:any){
    this.toastr.error("Ocorreu um erro ao processar a sua solicitação!");
    this.submittingForm = false;

    if(error.status === 422)
      this.serverErrorMessages = JSON.parse(error._body).erros;
      ["Nome já existe", "O email não pode ficar em branco"]
  }

}
