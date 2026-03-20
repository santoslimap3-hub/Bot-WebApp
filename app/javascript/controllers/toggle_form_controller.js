import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [
        "loginCard", "signupCard",
        "loginTitle", "loginSubtitle", "signupTitle", "signupSubtitle",
        "signInButton", "password", "email",
        "signUpEmail", "signUpPassword", "signUpPasswordConfirmation", "signupButton"
    ]

    connect() {}

    toggle() {
        this.loginCardTarget.classList.toggle("d-none")
        this.signupCardTarget.classList.toggle("d-none")

        if (this.hasLoginTitleTarget) {
            this.loginTitleTarget.classList.toggle("d-none")
            this.loginSubtitleTarget.classList.toggle("d-none")
            this.signupTitleTarget.classList.toggle("d-none")
            this.signupSubtitleTarget.classList.toggle("d-none")
        }
    }

    checkFields() {
        const isSignUpVisible = this.hasSignupCardTarget && !this.signupCardTarget.classList.contains("d-none")

        if (isSignUpVisible) {
            const email = this.signUpEmailTarget.value
            const pass = this.signUpPasswordTarget.value
            const confirm = this.signUpPasswordConfirmationTarget.value

            this.signupButtonTarget.disabled = !(
                email.length > 0 &&
                email.includes("@") &&
                email.includes(".") &&
                pass.length > 0 &&
                confirm.length > 0 &&
                pass === confirm
            )
        } else {
            const email = this.emailTarget.value
            const pass = this.passwordTarget.value

            this.signInButtonTarget.disabled = !(
                email.length > 0 &&
                email.includes("@") &&
                email.includes(".") &&
                pass.length > 0
            )
        }
    }
}