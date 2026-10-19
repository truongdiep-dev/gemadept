import { initRegistration } from './features/registration.js';
import { initBilingualInputs } from './components/bilingual-input.js';
import { initSelects } from './components/select.js';
import { initDatePickers } from './components/date-picker.js';
import { initRouter } from './router/index.js';

initRegistration();
initBilingualInputs();
initSelects();
initDatePickers();
initRouter();
