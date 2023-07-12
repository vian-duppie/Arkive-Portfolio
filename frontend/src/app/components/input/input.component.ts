import { Component, EventEmitter, Input, Output } from '@angular/core';

interface InputProps {
    type?: string
    placeholder?: string
    value?: string
}

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})

export class InputComponent {
    @Input() props: InputProps = {
        type: 'text',
        placeholder: 'Input'
    }

    @Output() valueChange = new EventEmitter<string>()

    onInputChange(value: string) {
        this.valueChange.emit(value)
    }

    showPassword: boolean = false

    changePasswordVisibility() {
        this.showPassword = !this.showPassword
        console.log(this.showPassword)
    }


    // ngOnInit() {
    //     if ( this.props.type != 'password' ) {
    //         // this.showPassword = true
    //     } 
    //     console.log(this.props)
    //     console.log('hey')
    // }
}
