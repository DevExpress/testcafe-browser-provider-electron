import dedent from 'dedent';
import { render as renderTemplate } from 'mustache';
import CONSTANTS from './constants';

export default {
    mainUrlWasNotLoaded: dedent `
        The page specified by the mainWindowUrl option was not loaded. 
        It may be the one from the following list:
        
        {{#openedUrls}}
        {{{.}}}
        {{/openedUrls}}
    `,

    render (template, data) {
        return CONSTANTS.electronErrorMarker + renderTemplate(template, data);
    }
};
