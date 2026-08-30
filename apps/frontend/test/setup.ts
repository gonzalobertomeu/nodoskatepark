import { GlobalRegistrator } from '@happy-dom/global-registrator';

// A concrete URL, not the default about:blank: the shell's router reads location.pathname and
// drives history, so the document needs a real origin to navigate within.
GlobalRegistrator.register({ url: 'http://localhost:4321/' });
