# Client-Side PDF Password Remover

A simple web application to drop in a PDF and remove its password, entirely client side.

Give it a try here: https://ondkloss.github.io/client-side-pdf-password-remover/

## Dependencies

It uses [@cantoo/pdf-lib](https://www.npmjs.com/package/@cantoo/pdf-lib), a fork of [pdf-lib](https://www.npmjs.com/package/pdf-lib), that among other things adds support for encrypted PDFs.

## Limitations

- Only works with PDFs that can be unlocked with a password
- Large PDF files may take longer to process
- Browser memory limitations may affect very large files

## Contributing

Feel free to submit issues and pull requests to improve the application.

## License

This project is open source. Feel free to use, modify, and distribute.

## Disclosure

This repo is very much made possible by Copilot, which did the bulk of the code. Thanks for the assist Copilot!
