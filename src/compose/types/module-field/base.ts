import { merge } from 'lodash'
import { IsOf } from '../../../guards'
import { Apply, CortezaID, NoID } from '../../../cast'
import { IsEmpty, ValidatorError, ValidatorResult } from '../../../validator/validator'

export const FieldNameValidator = /^\w{1,}$/

export interface Capabilities {
  configurable: true;
  multi: boolean;
  writable: boolean;
  required: boolean;
  private: boolean;
}

interface DefaultValue {
  value: string;
}

export class ModuleField {
  public fieldID = NoID
  public name = ''
  public kind = ''
  public label = ''

  public defaultValue: Array<DefaultValue> = []
  public maxLength = 0

  public isRequired = false
  public isPrivate = false
  public isMulti = false
  public isSystem = false
  public isWritable = false

  public options: object = {}

  public canUpdateRecordValue = false
  public canReadRecordValue = false

  constructor (f?: Partial<ModuleField>) {
    this.apply(f)
  }

  clone (): ModuleField {
    return new ModuleField(JSON.parse(JSON.stringify(this)))
  }

  public apply (f?: Partial<ModuleField>): void {
    if (!f) return

    Apply(this, f, CortezaID, 'fieldID')
    Apply(this, f, String, 'name', 'label', 'kind')
    Apply(this, f, Number, 'maxLength')
    Apply(this, f, Boolean, 'isRequired', 'isPrivate', 'isMulti', 'isSystem', 'isWritable')

    // Make sure field is align with it's capabilities
    if (!this.cap.multi) this.isMulti = false
    if (!this.cap.required) this.isRequired = false
    if (!this.cap.private) this.isPrivate = false
    if (!this.cap.writable) this.isWritable = false

    if (f.defaultValue && Array.isArray(f.defaultValue)) {
      /**
       * Converting default value into proper format
       * so we can use it without convertion
       */
      this.defaultValue = f.defaultValue
        // Remove nulls & undefineds
        .filter(({ value }) => value !== undefined && value !== null)
        // Trim def. value object to bare minimum, we only need "value"
        .map(({ value }) => ({ value }))
    }

    if (this.isSystem) {
      this.canUpdateRecordValue = true
      this.canReadRecordValue = true
    } else {
      Apply(this, f, Boolean, 'canUpdateRecordValue', 'canReadRecordValue')
    }

    if (IsOf(f, 'kind')) {
      this.kind = f.kind
    }

    if (IsOf(f, 'options')) {
      this.options = merge({}, this.options, f.options)
    }
  }

  /**
   * Test field validity
   *
   * Expecting valid name
   */
  public get isValid (): boolean {
    return FieldNameValidator.test(this.name)
  }

  /**
   * Per module field type capabilities
   */
  public get cap (): Readonly<Capabilities> {
    return {
      configurable: true,
      multi: true,
      writable: true,
      required: true,
      private: true,
    }
  }

  /**
   * Creates standard field validator
   *
   * It tests value if field is marked as required
   */
  public validateValue (newValue: string|string[]): ValidatorResult {
    if (this.isRequired) {
      if (IsEmpty(newValue)) {
        // @todo return something typified...
        return new ValidatorError('missing required value')
      }
    }
  }

  /**
   * Returns resource ID
   */
  get resourceID (): string {
    return `${this.resourceType}:${this.fieldID}`
  }

  /**
   * Resource type
   */
  get resourceType (): string {
    return 'compose:module-field'
  }
}

export const Registry = new Map<string, typeof ModuleField>()
