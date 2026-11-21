/** Words JavaScript reserves: they can't be used as variable names. */
export const RESERVED_WORDS = new Set(
  (
    'break case catch class const continue debugger default delete do else export extends false ' +
    'finally for function if import in instanceof new null return super switch this throw true ' +
    'try typeof var void while with yield let static await enum implements interface package ' +
    'private protected public'
  ).split(' '),
);

/** Challenge mode for NameChecker: is each name valid? */
export const NAME_CHALLENGE: { name: string; valid: boolean; why: string }[] = [
  { name: '2ndPlace', valid: false, why: 'A name can’t start with a digit.' },
  { name: 'player2', valid: true, why: 'Digits are fine after the first character.' },
  { name: 'first-name', valid: false, why: 'A dash means minus, so it can’t be in a name.' },
  { name: 'firstName', valid: true, why: 'camelCase: the standard JavaScript style.' },
  { name: 'class', valid: false, why: 'class is a reserved word.' },
  { name: '_count', valid: true, why: 'Names may start with an underscore.' },
  { name: '$price', valid: true, why: 'Names may start with a dollar sign.' },
  { name: 'my score', valid: false, why: 'Spaces aren’t allowed in names.' },
];
