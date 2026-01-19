import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Impure to update on signal change if we use signal inside, or just for safety with service state
})
export class TranslatePipe implements PipeTransform {
    constructor(private translationService: TranslationService) { }

    transform(value: string): string {
        return this.translationService.translate(value);
    }
}
