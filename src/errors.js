import dedent from 'dedent';
import { render as renderTemplate } from 'mustache';
import CONSTANTS from './constants';

export default {
    mainUrlWasNotLoaded: dedent `
        A page in the main window specified by the mainWindowUrl option was not loaded. 
        The affected page is one of the following:
        
        {{#openedUrls}}
        {{{.}}}
        {{/openedUrls}}
    `,

    render (template, data) {
        return CONSTANTS.electronErrorMarker + renderTemplate(template, data);
    }
};
