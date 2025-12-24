# nano-slug

The smallest, most efficient URL-slug generator using modern `String.prototype.normalize`.

## Installation

```bash
npm install nano-slug
```

## Usage

```ts
import { slugify } from 'nano-slug';

slugify('Hello World');         // => 'hello-world'
slugify('Café Résumé');         // => 'cafe-resume'
slugify('Rock & Roll');         // => 'rock-and-roll'
slugify('Title', { separator: '_' }); // => 'title'
slugify('Long Title', { maxLength: 5 }); // => 'long'
```

## Options

- `separator` - Character separator (default: `-`)
- `maxLength` - Maximum length truncation
- `replacements` - Custom character replacements

## License

MIT
