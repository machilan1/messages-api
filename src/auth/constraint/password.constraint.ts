import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'test', async: false })
export class PasswordConstraint implements ValidatorConstraintInterface {
  validate(
    value: string,
    validationArguments?: ValidationArguments,
  ): boolean | Promise<boolean> {
    console.log(value);
    return value.length >= 6;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Invalid password';
  }
}
