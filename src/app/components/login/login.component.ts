import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-service/user.service';
import { FileService } from '../../services/file-service/file.service';
import { EmailService } from '../../services/email-service/email.service';
import { User } from '../../models/user';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  changePasswordForm: FormGroup;
  showChangePassword = false;
  username = "";
  logoPath = "";

  constructor(
    private formBuilder: FormBuilder,
    private authService: UserService,
    private router: Router,
    private fileService: FileService,
    private emailService: EmailService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.logoPath = this.fileService.getImageUrlByName("PU_Logo.png");
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.username = username;
      this.authService.login(username, password).subscribe(
        (user: any) => {
          
          if (user.id != null) {
            localStorage.setItem('currentUser', JSON.stringify({ user }));
            if (password == "123") {
              this.showChangePassword = true;
            } else {
              this.router.navigate(['/home']);
            }
          } else {
            alert('Neispravni Login Podaci!');
          }
        },
      );
    }
  }

  onChangePassword() {
    if (this.changePasswordForm.valid) {
      const newPassword = this.changePasswordForm.value.newPassword;
      this.authService.changePassword(this.username, newPassword).subscribe(
        (user: any) => {
          if (user) {
            //localStorage.setItem('currentUser', JSON.stringify({ user })); sifra nam nece trebati u kesu
            this.router.navigate(['/home']);
          } else {
            alert('Došlo je do greške prilikom promene lozinke!');
          }
        }
      );
    }
  }

  onForgotPassword() {
  const email = this.loginForm.get('username')?.value;

  if (!email) {
    alert("Unesite email pre nego što zatražite resetovanje lozinke.");
    return;
  }

  this.authService.getPasswordByEmail(email).subscribe({
    next: (res: any) => {
      if (res === true || res?.success !== false) {
        alert('Nova lozinka je poslata na vaš email!');
      } else {
        alert('Korisnik sa tim emailom ne postoji.');
      }
    },
    error: () => alert('Došlo je do greške.')
  });
}
}
