import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupName, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";

import { Category } from '../shared/category.model';
import { CategoryService } from '../shared/category.service';

import{ switchMap } from "rxjs/operators";
import { toBase64String } from '@angular/compiler/src/output/source_map';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit, AfterContentChecked {

  submittingForm: boolean = false;
  category: Category = new Category();
  currentAction: string = "";
  pageTitle: string = "";
  serverErrorMessages: string[] = [];
  idCategory: number = 0;
  categoryForm: FormGroup = this.formBuilder.group({
    id: [null],
    name: [null, [Validators.required, Validators.minLength(2)]],
    description: [null]
  });;

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    
  }

  ngOnInit(): void {
    this.setCurrentAction();
    this.buildCategoryForm();
    this.loadCategory();
  }


  ngAfterContentChecked(){
    this.setPageTitle();
  }
  submitForm() {
    this.submittingForm = true;

    if(this.currentAction == "new")
    this.createCategory();
    else // currentAction == "edit"
      this.updateCategory();
  }

  // PRIVATE METHODS

  private setCurrentAction() {
    if(this.route.snapshot.url[0].path == "new")
      this.currentAction = "new"
    else
      this.currentAction = "edit"
  }

  private buildCategoryForm() {
    this.categoryForm = this.formBuilder.group({
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null]
    });
  }

  private loadCategory() {
    if (this.currentAction == "edit") {
      this.route.params.subscribe(params => this.idCategory = params['id']);
      console.log(this.idCategory); 
      this.categoryService.getById(this.idCategory).subscribe(
        (category) => {
          console.log(category);
          this.category = category;
          this.categoryForm.patchValue(this.category) // binds loaded category data to CategoryForm
        },
        (error) => alert('Ocorreu um erro no servidor, tente novamente mais tarde')
      )
    }
  }

  private setPageTitle() {
    if (this.currentAction == 'new')
      this.pageTitle = 'Cadastro de Nova Categoria'
    else {
      const categoryName = this.category.name || ""
      this.pageTitle = 'Editando Categoria: ' + categoryName;
    }
  }
  private createCategory(){
    const category: Category = Object.assign(new Category(), this.categoryForm.value);

    this.categoryService.create(category)
    .subscribe(
      category => this.actionsForSuccess(category),
      error => this.actionsForError(error)
    )
  }
  private updateCategory() {
    const category: Category = Object.assign(new Category(), this.categoryForm.value)

    this.categoryService.update(category).subscribe(
      category => this.actionsForSuccess(category),
      error => this.actionsForError(error)
    )
  }

  private actionsForSuccess(category: Category){
    //toastr.success("Solicitação processada com sucesso!");
    console.info("Solicitação processada com sucesso!");
    // redirect/reload component page
    this.router.navigateByUrl("categories", {skipLocationChange: true}).then(
      () => this.router.navigate(["categories", category.id, "edit"])
    )
  }

  private actionsForError(error:any){
    //toastr.error("Ocorreu um erro ao processar a sua solicitação!");
    console.error("Ocorreu um erro ao processar a sua solicitação!");
    this.submittingForm = false;

    if(error.status === 422)
      this.serverErrorMessages = JSON.parse(error._body).erros;
      ["Nome já existe", "O email não pode ficar em branco"]
  }

}
