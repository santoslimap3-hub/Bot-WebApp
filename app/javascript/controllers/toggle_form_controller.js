import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["loginCard", "signupCard", "signInButton", "password", "password_confirmation", "email", "signUpEmail", "signUpPassword", "signUpPasswordConfirmation", "signupButton"]

    connect(){}
    toggle() {

        this.loginCardTarget.classList.toggle("d-none")
        this.signupCardTarget.classList.toggle("d-none")

    }
    checkFields() {

        if (

            this.signUpPasswordTarget.value === this.signUpPasswordConfirmationTarget.value && 
            this.signUpPasswordTarget.value.length > 0 && 
            this.signUpPasswordConfirmationTarget.value.length > 0 && 
            this.signUpEmailTarget.value.length > 0 && 
            this.signUpEmailTarget.value.includes("@") &&
            this.signUpEmailTarget.value.includes(".")

        ) {

            this.signupButtonTarget.disabled = false;

        } else if (
            this.passwordTarget.value.length > 0 && 
            this.emailTarget.value.length > 0 && 
            this.emailTarget.value.includes("@") &&
            this.emailTarget.value.includes(".")
        ) {
            this.signInButtonTarget.disabled = false;
        } else {

            this.signupButtonTarget.disabled = true;
            this.signInButtonTarget.disabled = true;

        }

    }
};